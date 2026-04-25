import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('password123', 12);
console.log(hash);
