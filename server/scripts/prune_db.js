import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Organization from '../src/models/organization.model.js';
import Asset from '../src/models/asset.model.js';
import Violation from '../src/models/violation.model.js';
import Alert from '../src/models/alert.model.js';
import ScanJob from '../src/models/scanJob.model.js';
import ScanResult from '../src/models/scanResult.model.js';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env');
  process.exit(1);
}

async function prune() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Get all organizations
    const orgs = await Organization.find({});
    const orgIds = orgs.map(o => o._id);
    console.log(`Found ${orgs.length} organizations in total.`);

    // 2. Delete data belonging to non-existent organizations (orphans)
    const delOrphanedViolations = await Violation.deleteMany({ orgId: { $nin: orgIds } });
    const delOrphanedAssets = await Asset.deleteMany({ orgId: { $nin: orgIds } });
    const delOrphanedAlerts = await Alert.deleteMany({ orgId: { $nin: orgIds } });
    const delOrphanedScanJobs = await ScanJob.deleteMany({ orgId: { $nin: orgIds } });
    const delOrphanedScanResults = await ScanResult.deleteMany({ orgId: { $nin: orgIds } });

    console.log('\n🧹 Orphans cleaned:');
    console.log(`- Deleted ${delOrphanedAssets.deletedCount} orphaned assets`);
    console.log(`- Deleted ${delOrphanedViolations.deletedCount} orphaned violations`);
    console.log(`- Deleted ${delOrphanedAlerts.deletedCount} orphaned alerts`);
    console.log(`- Deleted ${delOrphanedScanJobs.deletedCount} orphaned scan jobs`);
    console.log(`- Deleted ${delOrphanedScanResults.deletedCount} orphaned scan results`);

    // 3. For each active organization, prune their records
    for (const org of orgs) {
      console.log(`\n------------------------------------------------------------`);
      console.log(`Pruning data for: ${org.email} (${org.orgName})`);

      // Prune scan jobs - keep only the 5 most recent
      const jobs = await ScanJob.find({ orgId: org._id }).sort({ createdAt: -1 });
      if (jobs.length > 5) {
        const jobsToKeep = jobs.slice(0, 5).map(j => j._id);
        const delJobs = await ScanJob.deleteMany({ orgId: org._id, _id: { $nin: jobsToKeep } });
        console.log(`- Kept 5 scan jobs, deleted ${delJobs.deletedCount} old scan jobs`);
      } else {
        console.log(`- Scan jobs count is ${jobs.length}, no pruning needed`);
      }

      // Prune scan results - delete any scan result whose scanJobId is no longer present
      const remainingJobIds = (await ScanJob.find({ orgId: org._id })).map(j => j._id);
      const delResults = await ScanResult.deleteMany({ orgId: org._id, scanJobId: { $nin: remainingJobIds } });
      console.log(`- Deleted ${delResults.deletedCount} obsolete scan results`);

      // Prune violations - keep only the 15 most recent violations
      const violations = await Violation.find({ orgId: org._id }).sort({ detectedAt: -1 });
      if (violations.length > 15) {
        const violationsToKeep = violations.slice(0, 15).map(v => v._id);
        const delVio = await Violation.deleteMany({ orgId: org._id, _id: { $nin: violationsToKeep } });
        console.log(`- Kept 15 violations, deleted ${delVio.deletedCount} old violations`);
      } else {
        console.log(`- Violations count is ${violations.length}, no pruning needed`);
      }

      // Prune alerts - keep only the 5 most recent alerts
      const alerts = await Alert.find({ orgId: org._id }).sort({ createdAt: -1 });
      if (alerts.length > 5) {
        const alertsToKeep = alerts.slice(0, 5).map(a => a._id);
        const delAl = await Alert.deleteMany({ orgId: org._id, _id: { $nin: alertsToKeep } });
        console.log(`- Kept 5 alerts, deleted ${delAl.deletedCount} old alerts`);
      } else {
        console.log(`- Alerts count is ${alerts.length}, no pruning needed`);
      }

      // Update the violationsFound count for remaining assets
      const assets = await Asset.find({ orgId: org._id });
      for (const asset of assets) {
        const count = await Violation.countDocuments({ orgId: org._id, assetId: asset._id });
        await Asset.findByIdAndUpdate(asset._id, { violationsFound: count });
      }
      console.log(`- Recalculated and updated violationsCount for ${assets.length} assets`);
    }

    console.log('\n✨ Database pruning completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Pruning failed:', error);
    process.exit(1);
  }
}

prune();
