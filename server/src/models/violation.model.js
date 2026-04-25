import mongoose from 'mongoose';

const violationSchema = new mongoose.Schema(
	{
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
		scanJobId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ScanJob',
			required: true,
			index: true,
		},
		sourceUrl: {
			type: String,
			required: true,
		},
		sourceDomain: {
			type: String,
			default: null,
			index: true,
		},
		sourceFirstSeenAt: {
			type: Date,
			default: null,
		},
		sourceLastSeenAt: {
			type: Date,
			default: null,
		},
		sourceSeenCount: {
			type: Number,
			default: 1,
			min: 1,
		},
		repeatOffenderScore: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		platform: {
			type: String,
			required: true,
		},
		discoveryKeyword: {
			type: String,
			default: null,
		},
		screenshotUrl: {
			type: String,
			default: null,
		},
		matchConfidence: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		matchType: {
			type: String,
			enum: ['exact', 'near-duplicate', 'partial'],
			required: true,
		},
		status: {
			type: String,
			enum: ['open', 'reported', 'resolved', 'false_positive'],
			default: 'open',
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
			visionLabelOverlapScore: {
				type: Number,
				default: null,
			},
			visionConfidenceBoost: {
				type: Number,
				default: null,
			},
			visionLabels: {
				type: [String],
				default: [],
			},
		},
		detectedAt: {
			type: Date,
			default: Date.now,
		},
		resolvedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

violationSchema.index({ orgId: 1, createdAt: -1 });
violationSchema.index({ orgId: 1, status: 1 });
violationSchema.index({ orgId: 1, platform: 1 });
violationSchema.index({ orgId: 1, assetId: 1 });
violationSchema.index({ orgId: 1, sourceDomain: 1, detectedAt: -1 });

const Violation = mongoose.model('Violation', violationSchema);

export default Violation;
