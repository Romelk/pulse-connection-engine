import path from 'path';

export const config = {
  port: process.env.PORT || 8080,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3002',
  dbPath: path.join(__dirname, '../../data/operations.db'),
};
