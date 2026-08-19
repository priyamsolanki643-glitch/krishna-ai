import { createLogger } from '../utils/logger.js';

const log = createLogger('admin-service');

export class AdminService {
  async getSystemStats() {
    return { users: 10, memoryUsage: process.memoryUsage().heapUsed };
  }

  async getAllUsers() {
    return [{ id: '1', email: 'test@example.com' }];
  }
}

export const adminService = new AdminService();
