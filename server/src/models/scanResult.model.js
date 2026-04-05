import mongoose from 'mongoose';

const scanResultSchema = new mongoose.Schema(
	{
		scanJobId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ScanJob',
			required: true,
			index: true,
		},
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Organization',
			required: true,
			index: true,
		},
		assetId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Asset',
			required: true,
			index: true,
		},
		sourceUrl: {
			type: String,
			required: true,
		},
		platform: {
			type: String,
			required: true,
		},
		thumbnailUrl: {
			type: String,
			default: null,
		},
		videoUrl: {
			type: String,
			default: null,
		},
		pageTitle: {
			type: String,
			default: null,
		},
		scrapedAt: {
			type: Date,
			default: Date.now,
		},
		status: {
			type: String,
			enum: ['pending_match', 'matched', 'no_match'],
			default: 'pending_match',
		},
		matchConfidence: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		matchType: {
			type: String,
			enum: ['exact', 'near-duplicate', 'partial', null],
			default: null,
		},
		evidenceBundle: {
			hammingDistance: {
				type: Number,
				default: null,
			},
			colorSimilarity: {
				type: Number,
				default: null,
			},
			frameMatchCount: {
				type: Number,
				default: null,
			},
		},
	},
	{ timestamps: true },
);

scanResultSchema.index({ scanJobId: 1, createdAt: -1 });

const ScanResult = mongoose.model('ScanResult', scanResultSchema);

export default ScanResult;