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
			select: false,
			required: true,
		},
		refreshTokenHash: {
			type: String,
			select: false,
			default: null,
		},
		plan: {
			type: String,
			enum: ['free', 'pro'],
			default: 'free',
		},
		lastLoginAt: {
			type: Date,
			default: null,
		},
		notificationPrefs: {
			emailOnHighConfidence: {
				type: Boolean,
				default: true,
			},
			emailDigest: {
				type: Boolean,
				default: false,
			},
			inAppAlerts: {
				type: Boolean,
				default: true,
			},
		},
	},
	{
		timestamps: true,
	},
);

organizationSchema.index({ email: 1 }, { unique: true });

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;