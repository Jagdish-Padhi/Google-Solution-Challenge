import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
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
		rangeLabel: {
			type: String,
			required: true,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
		},
		fileUrl: {
			type: String,
			required: true,
		},
		fileName: {
			type: String,
			required: true,
		},
		stats: {
			totalViolations: {
				type: Number,
				default: 0,
			},
			resolvedViolations: {
				type: Number,
				default: 0,
			},
			avgConfidenceScore: {
				type: Number,
				default: 0,
			},
			resolutionRate: {
				type: Number,
				default: 0,
			},
		},
		generatedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true },
);

reportSchema.index({ orgId: 1, generatedAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
