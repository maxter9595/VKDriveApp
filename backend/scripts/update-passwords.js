import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const updatePasswords = async (adminPassword, testPassword) => {
  try {
    if (!adminPassword || !testPassword) {
      throw new Error('Оба пароля должны быть указаны');
    }

    const adminHash = bcrypt.hashSync(adminPassword, 12);
    const testHash = bcrypt.hashSync(testPassword, 12);

    const sqlFilePath = join(__dirname, '..', 'sql', 'init-users.sql');
    let sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    sqlContent = sqlContent
      .replace('$2b$12$YOUR_HASHED_PASSWORD_HERE', adminHash)
      .replace('$2b$12$YOUR_HASHED_TEST_PASSWORD_HERE', testHash);

    await fs.writeFile(sqlFilePath, sqlContent);
    console.log('SQL файл успешно обновлен с хешированными паролями');
  } catch (error) {
    console.error('Ошибка при обновлении паролей:', error.message);
    process.exit(1);
  }
};

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Использование: npm run update-passwords -- <admin-password> <test-password>');
  console.error('Пример: npm run update-passwords -- Admin123! TestUser123!');
  process.exit(1);
}

const [adminPassword, testPassword] = args;
updatePasswords(adminPassword, testPassword);
