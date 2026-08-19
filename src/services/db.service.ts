import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

const logger = createLogger('db-service');
const DB_FILE = path.join(process.cwd(), 'database.json');

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private localData: any = {
    users: [],
    sessions: [],
    messages: [],
    otps: [],
    memories: [],
    artifacts: []
  };
  private isLocal = true;

  constructor() {
    if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
      try {
        this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
        this.isLocal = false;
        logger.info('Supabase client initialized');
      } catch (err) {
        logger.error({ err }, 'Failed to init Supabase, using local JSON');
        this.initLocalDb();
      }
    } else {
      logger.info('Supabase not configured, using local JSON');
      this.initLocalDb();
    }
  }

  private async initLocalDb() {
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      this.localData = JSON.parse(data);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        await this.saveLocalDb();
      } else {
        logger.error({ err }, 'Failed to read local DB');
      }
    }
  }

  private async saveLocalDb() {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(this.localData, null, 2));
    } catch (err) {
      logger.error({ err }, 'Failed to save local DB');
    }
  }

  private generateId() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Users
  async getUser(id: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('users').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    }
    return this.localData.users.find((u: any) => u.id === id) || null;
  }

  async getUserByEmail(email: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('users').select('*').eq('email', email).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    return this.localData.users.find((u: any) => u.email === email) || null;
  }

  async createUser(userData: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('users').insert(userData).select().single();
      if (error) throw error;
      return data;
    }
    const newUser = { id: this.generateId(), ...userData, created_at: new Date().toISOString() };
    this.localData.users.push(newUser);
    await this.saveLocalDb();
    return newUser;
  }

  async updateUser(id: string, updates: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('users').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const idx = this.localData.users.findIndex((u: any) => u.id === id);
    if (idx !== -1) {
      this.localData.users[idx] = { ...this.localData.users[idx], ...updates, updated_at: new Date().toISOString() };
      await this.saveLocalDb();
      return this.localData.users[idx];
    }
    return null;
  }

  // Sessions
  async getSessions(userId: string, page = 1, limit = 10) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
      if (error) throw error;
      return data;
    }
    const sessions = this.localData.sessions.filter((s: any) => s.user_id === userId).reverse();
    return sessions.slice((page - 1) * limit, page * limit);
  }

  async getSession(id: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('sessions').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    }
    return this.localData.sessions.find((s: any) => s.id === id) || null;
  }

  async createSession(sessionData: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('sessions').insert(sessionData).select().single();
      if (error) throw error;
      return data;
    }
    const newSession = { id: this.generateId(), ...sessionData, created_at: new Date().toISOString() };
    this.localData.sessions.push(newSession);
    await this.saveLocalDb();
    return newSession;
  }

  async updateSession(id: string, updates: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('sessions').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const idx = this.localData.sessions.findIndex((s: any) => s.id === id);
    if (idx !== -1) {
      this.localData.sessions[idx] = { ...this.localData.sessions[idx], ...updates, updated_at: new Date().toISOString() };
      await this.saveLocalDb();
      return this.localData.sessions[idx];
    }
    return null;
  }

  async deleteSession(id: string) {
    if (this.supabase) {
      const { error } = await this.supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    this.localData.sessions = this.localData.sessions.filter((s: any) => s.id !== id);
    await this.saveLocalDb();
    return true;
  }

  // Messages
  async getMessages(sessionId: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('session_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    }
    return this.localData.messages.filter((m: any) => m.session_id === sessionId);
  }

  async createMessage(msgData: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('session_messages').insert(msgData).select().single();
      if (error) throw error;
      return data;
    }
    const newMessage = { id: this.generateId(), ...msgData, created_at: new Date().toISOString() };
    this.localData.messages.push(newMessage);
    await this.saveLocalDb();
    return newMessage;
  }

  async getRecentMessages(sessionId: string, limit: number) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('session_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data.reverse();
    }
    const msgs = this.localData.messages.filter((m: any) => m.session_id === sessionId);
    return msgs.slice(-limit);
  }

  // OTP
  async createOTP(email: string, hashedOtp: string, expiresAt: Date) {
    const otpData = { email, hashed_otp: hashedOtp, expires_at: expiresAt.toISOString(), attempts: 0, verified: false };
    if (this.supabase) {
      const { data, error } = await this.supabase.from('otps').insert(otpData).select().single();
      if (error) throw error;
      return data;
    }
    const newOTP = { id: this.generateId(), ...otpData, created_at: new Date().toISOString() };
    this.localData.otps.push(newOTP);
    await this.saveLocalDb();
    return newOTP;
  }

  async getLatestOTP(email: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('otps').select('*').eq('email', email).order('created_at', { ascending: false }).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    const otps = this.localData.otps.filter((o: any) => o.email === email).reverse();
    return otps[0] || null;
  }

  async markOTPVerified(id: string) {
    if (this.supabase) {
      const { error } = await this.supabase.from('otps').update({ verified: true }).eq('id', id);
      if (error) throw error;
      return true;
    }
    const idx = this.localData.otps.findIndex((o: any) => o.id === id);
    if (idx !== -1) {
      this.localData.otps[idx].verified = true;
      await this.saveLocalDb();
    }
    return true;
  }

  async incrementOTPAttempts(id: string) {
    if (this.supabase) {
      const { data } = await this.supabase.from('otps').select('attempts').eq('id', id).single();
      if (data) {
        await this.supabase.from('otps').update({ attempts: data.attempts + 1 }).eq('id', id);
      }
      return true;
    }
    const idx = this.localData.otps.findIndex((o: any) => o.id === id);
    if (idx !== -1) {
      this.localData.otps[idx].attempts += 1;
      await this.saveLocalDb();
    }
    return true;
  }

  // Memory
  async searchMemories(userId: string, embedding: number[], limit = 5) {
    if (this.supabase) {
      const { data, error } = await this.supabase.rpc('match_memories', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit,
        p_user_id: userId
      });
      if (error) throw error;
      return data;
    }
    return this.localData.memories.filter((m: any) => m.user_id === userId).slice(0, limit);
  }

  async createMemory(memData: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('memories').insert(memData).select().single();
      if (error) throw error;
      return data;
    }
    const newMemory = { id: this.generateId(), ...memData, created_at: new Date().toISOString() };
    this.localData.memories.push(newMemory);
    await this.saveLocalDb();
    return newMemory;
  }

  async deleteUserData(userId: string) {
    if (this.supabase) {
      const { error } = await this.supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      return true;
    }
    this.localData.users = this.localData.users.filter((u: any) => u.id !== userId);
    this.localData.sessions = this.localData.sessions.filter((s: any) => s.user_id !== userId);
    await this.saveLocalDb();
    return true;
  }

  // Artifacts
  async createArtifact(artifactData: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('artifacts').insert(artifactData).select().single();
      if (error) throw error;
      return data;
    }
    const newArtifact = { id: this.generateId(), ...artifactData, created_at: new Date().toISOString() };
    this.localData.artifacts.push(newArtifact);
    await this.saveLocalDb();
    return newArtifact;
  }

  async getArtifacts(sessionId: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('artifacts').select('*').eq('session_id', sessionId);
      if (error) throw error;
      return data;
    }
    return this.localData.artifacts.filter((a: any) => a.session_id === sessionId);
  }
}

export const db = new DatabaseService();
