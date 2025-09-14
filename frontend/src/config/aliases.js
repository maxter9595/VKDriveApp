import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const aliases = {
  '@': path.resolve(__dirname, '../'),
  '@components': path.resolve(__dirname, '../components'),
  '@api': path.resolve(__dirname, '../api'),
  '@styles': path.resolve(__dirname, '../styles'),
  '@utils': path.resolve(__dirname, '../utils'),
  '@assets': path.resolve(__dirname, '../assets')
};

export default aliases;
