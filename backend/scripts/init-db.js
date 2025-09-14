import dotenv from 'dotenv';

import { initDatabase } from '../config/database.js';

dotenv.config();

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

initializeDatabase();
