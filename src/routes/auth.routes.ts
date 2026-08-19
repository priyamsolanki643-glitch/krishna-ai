import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { strictRateLimitMiddleware } from '../middleware/rate-limit.middleware.js';
import { db as dbService } from '../services/db.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AuthRoutes');

const authRouter = new Hono<{ Variables: { userId: string } }>();

// Schemas
const sendOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

// POST /auth/otp/send
authRouter.post(
  '/otp/send',
  strictRateLimitMiddleware(),
  zValidator('json', sendOtpSchema),
  async (c) => {
    try {
      const { email } = c.req.valid('json');

      const recentOtp = await dbService.getLatestOTP(email);

      // Check cooldown (60s between sends)
      if (recentOtp && new Date(recentOtp.created_at).getTime() > Date.now() - 60000) {
        return c.json({ error: 'Please wait 60 seconds before requesting another OTP' }, 429);
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Hash OTP with bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store in DB
      await dbService.createOTP(email, hashedOtp, expiresAt);

      // In development: log OTP to console AND return in response
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`Development OTP for ${email}: ${otp}`);
        return c.json({
          message: 'OTP sent',
          cooldownSeconds: 60,
          // DEV ONLY — remove in production
          dev_otp: otp,
          dev_note: '⚠️ DEV MODE: This OTP is shown here only for testing. Remove in production.',
        });
      } else {
        // In production: TODO placeholder for email service
        logger.info(`Sending OTP to ${email} via email service`);
      }

      return c.json({ message: 'OTP sent', cooldownSeconds: 60 });
    } catch (error) {
      logger.error({ err: error }, 'Error in /auth/otp/send:');
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// POST /auth/otp/verify
authRouter.post(
  '/otp/verify',
  zValidator('json', verifyOtpSchema),
  async (c) => {
    try {
      const { email, otp } = c.req.valid('json');

      const otpRecord = await dbService.getLatestOTP(email);

      if (!otpRecord || otpRecord.verified || otpRecord.status === 'EXPIRED' || otpRecord.status === 'FAILED') {
        return c.json({ error: 'No pending OTP found' }, 404);
      }

      // Check expiry
      if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
        // We'll treat this as logically expired even if status string in db is not updated.
        return c.json({ error: 'OTP expired' }, 400);
      }

      // Check max attempts (5)
      if (otpRecord.attempts >= 5) {
        return c.json({ error: 'Too many failed attempts. Request a new OTP.' }, 400);
      }

      // Increment attempts
      await dbService.incrementOTPAttempts(otpRecord.id);

      // Compare with bcrypt
      const isValid = await bcrypt.compare(otp, otpRecord.hashed_otp || otpRecord.hashedOtp);

      if (!isValid) {
        return c.json({ error: 'Invalid OTP' }, 400);
      }

      // If valid: mark OTP as VERIFIED
      await dbService.markOTPVerified(otpRecord.id);

      // Create/find user
      let user = await dbService.getUserByEmail(email);

      if (!user) {
        user = await dbService.createUser({
          email,
          name: email.split('@')[0],
          tier: 'FREE',
        });
      }

      // Generate JWT
      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
      const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
      
      const token = await sign(
        {
          sub: user.id,
          email: user.email,
          tier: user.tier,
          exp: expiresAt,
        },
        jwtSecret
      );

      return c.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
        },
        expiresAt: new Date(expiresAt * 1000).toISOString(),
      });
    } catch (error) {
      logger.error({ err: error }, 'Error in /auth/otp/verify:');
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// POST /auth/register
authRouter.post(
  '/register',
  zValidator('json', registerSchema),
  async (c) => {
    try {
      const { email, name } = c.req.valid('json');

      let user = await dbService.getUserByEmail(email);

      if (!user) {
        user = await dbService.createUser({
          email,
          name,
          tier: 'FREE',
        });
      }

      return c.json({ user });
    } catch (error) {
      logger.error({ err: error }, 'Error in /auth/register:');
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// GET /auth/me
authRouter.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const user = await dbService.getUser(userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    logger.error({ err: error }, 'Error in /auth/me:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { authRouter };
