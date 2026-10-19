const bcrypt = require('bcrypt');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
    console.log('Usage: node hash-password-tool.js <your-password>');
    console.log('Example: node hash-password-tool.js mypassword123');
    process.exit(1);
}

async function hashPassword() {
    try {
        const hash = await bcrypt.hash(password, 10);
        console.log('Password:', password);
        console.log('Hash:', hash);
    } catch (error) {
        console.error('Error hashing password:', error);
        process.exit(1);
    }
}

hashPassword();
