import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Organization',
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
			default: '',
		},
		tags: {
			type: [String],
			default: [],
		},
		type: {
			type: String,
			enum: ['video', 'image', 'highlight'],
			required: true,
		},
		storageKey: {
			type: String,
			required: true,
		},
		gcsUrl: {
			type: String,
			required: true,
		},
		thumbnailUrl: {
			type: String,
			default: null,
		},
		fingerprint: {
			pHash: {
				type: String,
				default: null,
			},
			videoHash: {
				type: String,
				default: null,
			},
			colorHistogram: {
				type: [Number],
				default: [],
			},
			frameHashes: {
				type: [String],
				default: [],
			},
		},
		duration: {
			type: Number,
			default: null,
		},
		fileSize: {
			type: Number,
			required: true,
		},
		status: {
			type: String,
			enum: ['processing', 'active', 'deleted', 'failed'],
			default: 'processing',
		},
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
		violationsFound: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true },
);

assetSchema.index({ orgId: 1, status: 1, uploadedAt: -1 });

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;