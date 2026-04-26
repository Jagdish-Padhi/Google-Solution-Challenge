import mongoose from 'mongoose';

const scanJobSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
    },
    platforms: {
      type: [String],
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    violationsCount: {
      type: Number,
      default: 0,
    },
    discoveryMetrics: {
      candidateUrlsFound: { type: Number, default: 0 },
      uniqueCandidates: { type: Number, default: 0 },
      keywordsUsed: { type: Number, default: 0 },
      geminiQueriesAdded: { type: Number, default: 0 },
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

scanJobSchema.index({ orgId: 1, createdAt: -1 });

const ScanJob = mongoose.model('ScanJob', scanJobSchema);

export default ScanJob;
