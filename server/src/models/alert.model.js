import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
	{
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Organization',
			required: true,
			index: true,
		},
		violationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Violation',
			default: null,
			index: true,
		},
		type: {
			type: String,
			enum: ['new_violation', 'high_confidence', 'platform_surge'],
			required: true,
		},
		severity: {
			type: String,
			enum: ['low', 'medium', 'high', 'critical'],
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		read: {
			type: Boolean,
			default: false,
		},
		channels: {
			type: [String],
			default: ['in-app'],
		},
	},
	{ timestamps: true },
);

alertSchema.index({ orgId: 1, read: 1, createdAt: -1 });
alertSchema.index({ orgId: 1, type: 1 });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
