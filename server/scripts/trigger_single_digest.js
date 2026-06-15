import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Organization from '../src/models/organization.model.js';
import Violation from '../src/models/violation.model.js';
import Asset from '../src/models/asset.model.js';
import ScanJob from '../src/models/scanJob.model.js';
import { sendWeeklyDigestEmail } from '../src/services/email.service.js';

const MONGO_URI = process.env.MONGO_URI;

async function trigger() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'code369decode@gmail.com';
    const org = await Organization.findOne({ email });

    if (!org) {
      console.error(`❌ Organization with email "${email}" not found.`);
      process.exit(1);
    }

    console.log(`Found organization: ${org.orgName} (${org.email})`);

    // Ensure we have at least one asset to link violations to
    let asset = await Asset.findOne({ orgId: org._id });
    if (!asset) {
      console.log('ℹ️ No assets found for this organization. Creating a mock asset...');
      asset = await Asset.create({
        orgId: org._id,
        title: 'Champions League Highlights — Exclusive Broadcaster Cut',
        type: 'video',
        description: 'Premium soccer broadcast highlights.',
        tags: ['Football', 'Champions League'],
        status: 'active',
        storageKey: `assets/${org._id}/cl_highlights.mp4`,
        storageUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/ucl.mp4',
        fileSize: 42000000,
        fingerprint: { pHash: 'abcdef1234567890' },
      });
      console.log(`✅ Created mock asset: "${asset.title}"`);
    }

    // Ensure we have a scan job
    let scanJob = await ScanJob.findOne({ orgId: org._id });
    if (!scanJob) {
      scanJob = await ScanJob.create({
        orgId: org._id,
        assetId: asset._id,
        status: 'completed',
        platforms: ['youtube', 'twitter', 'telegram', 'web'],
        keywords: ['champions league', 'football', 'stream'],
      });
      console.log('✅ Created mock Scan Job');
    }

    // We want the weekly digest to look impressive, let's make sure there are exactly 5 recent violations.
    // Clean up any recent violations from the last 7 days for this org to prevent duplicate spam,
    // and then insert 5 fresh ones representing different platforms.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await Violation.deleteMany({ orgId: org._id, detectedAt: { $gte: sevenDaysAgo } });

    console.log('Inserting 5 realistic recent violations for the weekly report...');
    const recentViolations = [
      {
        orgId: org._id,
        assetId: asset._id,
        scanJobId: scanJob._id,
        platform: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=unauthorizedUclStream',
        sourceDomain: 'youtube.com',
        matchConfidence: 94,
        matchType: 'exact',
        status: 'open',
        detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        orgId: org._id,
        assetId: asset._id,
        scanJobId: scanJob._id,
        platform: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=clGoalsLeaked',
        sourceDomain: 'youtube.com',
        matchConfidence: 91,
        matchType: 'exact',
        status: 'open',
        detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        orgId: org._id,
        assetId: asset._id,
        scanJobId: scanJob._id,
        platform: 'twitter',
        sourceUrl: 'https://x.com/sportsclips/status/1234567890',
        sourceDomain: 'x.com',
        matchConfidence: 85,
        matchType: 'near-duplicate',
        status: 'reported',
        detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        orgId: org._id,
        assetId: asset._id,
        scanJobId: scanJob._id,
        platform: 'telegram',
        sourceUrl: 'https://t.me/s/freeclstreams/42',
        sourceDomain: 't.me',
        matchConfidence: 89,
        matchType: 'near-duplicate',
        status: 'open',
        detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        orgId: org._id,
        assetId: asset._id,
        scanJobId: scanJob._id,
        platform: 'web',
        sourceUrl: 'https://totalsportek.to/stream/ucl-final',
        sourceDomain: 'totalsportek.to',
        matchConfidence: 97,
        matchType: 'exact',
        status: 'open',
        detectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
    ];

    const insertedViolations = await Violation.insertMany(recentViolations);
    console.log(`✅ Seeded ${insertedViolations.length} recent violations.`);

    // Update the violationsFound count for the asset
    const count = await Violation.countDocuments({ orgId: org._id, assetId: asset._id });
    await Asset.findByIdAndUpdate(asset._id, { violationsFound: count });

    console.log('📧 Triggering Brevo email for weekly digest...');
    await sendWeeklyDigestEmail(org, insertedViolations);
    console.log(`🎉 Weekly digest email successfully sent to ${email}!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to trigger weekly digest email:', error);
    process.exit(1);
  }
}

trigger();
