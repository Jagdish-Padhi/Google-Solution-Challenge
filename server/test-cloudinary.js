import 'dotenv/config';
import { cloudinary } from './src/config/cloudinary.js';

async function run() {
	try {
		console.log('Testing Cloudinary Connection...');
		const result = await cloudinary.api.ping();
		console.log('Cloudinary Ping Result:', result);
	} catch (error) {
		console.error('Cloudinary Test Failed:', error);
		process.exit(1);
	}
}

run();
