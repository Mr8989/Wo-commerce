import './config.js'; // must run first: it populates DATABASE_URL
import { PrismaClient } from '@prisma/client';
import { DEBUG } from './config.js';

export const prisma = new PrismaClient({
  log: DEBUG ? ['warn', 'error'] : ['error'],
});

export default prisma;
