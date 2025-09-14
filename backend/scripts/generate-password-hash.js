import bcrypt from 'bcryptjs';

const generateHash = async (password) => {
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('---');
  return hash;
};

const main = async () => {
  const passwords = process.argv.slice(2);
  
  if (passwords.length === 0) {
    console.log('Usage: npm run generate-password-hash -- <password1> <password2> ...');
    console.log('Example: npm run generate-password-hash -- Admin123! TestUser123!');
    process.exit(1);
  }
  
  console.log('Generating password hashes...\n');
  
  try {
    for (const password of passwords) {
      await generateHash(password);
    }
    console.log('All hashes generated successfully');
  } catch (error) {
    console.error('Error generating hashes:', error);
    process.exit(1);
  }
};

main();
