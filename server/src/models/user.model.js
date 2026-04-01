import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
	{
		orgName: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		passwordHash: {
			type: String,
			required: true,
		},
		plan: {
			type: String,
			enum: ['free', 'pro'],
			default: 'free',
		},
	},
	{
		timestamps: true,
	},
);

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;