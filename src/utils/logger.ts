import pino from 'pino';

const rootLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export function createLogger(name: string) {
  return rootLogger.child({ module: name });
}
