import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage engine
const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: 'sportshield_assets',
		resource_type: 'auto', // Allows uploading videos and images
		public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
	},
});

export { cloudinary, storage };
