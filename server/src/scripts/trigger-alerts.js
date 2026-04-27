import 'dotenv/config';
import { connectDatabase } from '../config/database.js';
import Asset from '../models/asset.model.js';
import Violation from '../models/violation.model.js';
import { sendViolationAlertEmail, sendSurgeAlertEmail } from '../services/email.service.js';

async function trigger() {
  try {
    console.log('🔗 Connecting to database...');
    await connectDatabase();
    const targetEmail = '2024.jagdish.padhi@ves.ac.in';
    
    // Find real violations to make the email look authentic
    const violations = await Violation.find().sort({ createdAt: -1 }).limit(3).populate('assetId');
    
    console.log(`🚀 Triggering 3 strategic alerts to ${targetEmail}...`);

    // 1. High Confidence Detection (Critical)
    const v1 = violations[0] || { platform: 'youtube', matchConfidence: 98, sourceUrl: 'https://youtube.com/watch?v=k6-k6-k6' };
    const v1Data = v1.toObject ? v1.toObject() : v1;
    await sendViolationAlertEmail(targetEmail, {
      ...v1Data,
      matchConfidence: 98,
      platform: v1Data.sourceUrl.includes('youtube') ? 'youtube' : (v1Data.sourceUrl.includes('twitter') ? 'twitter' : 'web'),
      detectedAt: new Date()
    });
    console.log('✅ Sent: High Confidence Detection Alert');

    // 2. Piracy Surge Alert (Threat Intelligence)
    await sendSurgeAlertEmail(targetEmail, {
      platform: 'twitter',
      count: 14,
      orgName: 'SportShield Partner'
    });
    console.log('✅ Sent: Platform Piracy Surge Alert (Twitter)');

    // 3. New Domain Discovery (Wide Distribution)
    const v2 = violations[1] || { platform: 'web', matchConfidence: 82, sourceUrl: 'https://pirate-streaming-site.net/live/match' };
    const v2Data = v2.toObject ? v2.toObject() : v2;
    await sendViolationAlertEmail(targetEmail, {
      ...v2Data,
      matchConfidence: 82,
      platform: v2Data.sourceUrl.includes('youtube') ? 'youtube' : (v2Data.sourceUrl.includes('twitter') ? 'twitter' : 'web'),
      detectedAt: new Date()
    });
    console.log('✅ Sent: Multi-Platform Discovery Alert');

    console.log('\n✨ All alerts dispatched successfully. Check your inbox!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to trigger alerts:', error.message);
    process.exit(1);
  }
}

trigger();
