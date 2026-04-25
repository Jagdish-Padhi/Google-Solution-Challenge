import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock/Model imports (relative to project structure)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Organization from '../src/models/organization.model.js';
import Asset from '../src/models/asset.model.js';
import Violation from '../src/models/violation.model.js';
import Alert from '../src/models/alert.model.js';
import ScanJob from '../src/models/scanJob.model.js';

const MONGO_URI = process.env.MONGO_URI;

const ASSET_TEMPLATES = [
    {
        title: 'IPL 2024 Final: KKR vs SRH Highlights',
        type: 'video',
        description: 'Official highlights of the Indian Premier League 2024 Final match.',
        tags: ['IPL', 'Cricket', 'Final', 'KKR', 'SRH'],
    },
    {
        title: 'UEFA Champions League: Real Madrid vs Dortmund',
        type: 'video',
        description: 'Exclusive broadcast rights for the UCL Final 2024.',
        tags: ['UCL', 'Football', 'Final', 'Real Madrid', 'BVB'],
    },
    {
        title: 'ICC T20 World Cup: IND vs PAK Highlights',
        type: 'video',
        description: 'Premium content from the high-voltage T20 World Cup clash.',
        tags: ['T20WC', 'Cricket', 'India', 'Pakistan', 'Highlights'],
    }
];

const PLATFORMS = ['youtube', 'twitter', 'telegram', 'web'];
const DOMAINS = ['vipleague.st', 'totalsportek.to', 'hesgoal.com', 'buffstreams.sx', 'piratestream.tv'];

async function seed() {
    try {
        console.log('🚀 Starting Demo Data Seeding...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create or Get Demo Organization
        let org = await Organization.findOne({ email: 'demo@sportshield.ai' });
        if (!org) {
            org = await Organization.create({
                orgName: 'SportShield Premier Rights',
                email: 'demo@sportshield.ai',
                passwordHash: '$2b$12$o8/UIs.UxIhqtzxx6eMI6.qlUVw/Dg10xc8HaRDF2QK5lVItpFCsy', // "password123"
                plan: 'pro',
                notificationPrefs: {
                    emailOnHighConfidence: true,
                    emailDigest: true,
                    inAppAlerts: true,
                }
            });
            console.log('✅ Created Demo Organization');
        }

        const orgId = org._id;

        // 2. Clear existing demo data
        await Asset.deleteMany({ orgId });
        await Violation.deleteMany({ orgId });
        await Alert.deleteMany({ orgId });
        await ScanJob.deleteMany({ orgId });
        console.log('🧹 Cleaned existing demo data for this org');

        // 3. Create Assets
        const createdAssets = [];
        for (const template of ASSET_TEMPLATES) {
            const asset = await Asset.create({
                orgId,
                ...template,
                status: 'active',
                violationsFound: 0,
                storageKey: `assets/${orgId}/${Date.now()}.mp4`,
                gcsUrl: `https://storage.googleapis.com/sportshield-assets/demo/${template.title.replace(/\s+/g, '_')}.mp4`,
                fileSize: 45000000, // 45MB
                fingerprint: {
                    pHash: 'f0f0f0f0f0f0f0f0',
                    colorHistogram: Array.from({ length: 64 }, () => Math.random()),
                    frameHashes: ['a1a1', 'b2b2', 'c3c3'],
                },
                createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
            });
            createdAssets.push(asset);
        }
        console.log(`✅ Created ${createdAssets.length} Assets`);

        // 4. Create Historical Violations (30-day timeline)
        const totalViolations = 450;
        const now = new Date();
        const violations = [];

        console.log(`⏳ Generating ${totalViolations} historical violations...`);
        for (let i = 0; i < totalViolations; i++) {
            const asset = createdAssets[i % createdAssets.length];
            const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
            const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
            
            // Distribute across last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const detectedAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
            
            // Random status distribution
            const statusRand = Math.random();
            const status = statusRand > 0.4 ? 'resolved' : (statusRand > 0.1 ? 'open' : 'false_positive');
            
            const confidence = 45 + Math.floor(Math.random() * 50);
            
            // Generate a realistic sports thumbnail based on the asset
            let screenshotUrl = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80'; // Generic Stadium
            if (asset.title.includes('IPL') || asset.title.includes('Cricket')) {
                screenshotUrl = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80'; // Cricket
            } else if (asset.title.includes('Champions League') || asset.title.includes('Football')) {
                screenshotUrl = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'; // Football
            }

            // For YouTube, use a real-looking thumbnail structure
            if (platform === 'youtube') {
                const mockIds = ['3VmsnL8Vdqc', 'dQw4w9WgXcQ', 'y6120QOlsfU', 'L_jWHffIx5E'];
                screenshotUrl = `https://img.youtube.com/vi/${mockIds[Math.floor(Math.random() * mockIds.length)]}/maxresdefault.jpg`;
            }
            
            violations.push({
                orgId,
                assetId: asset._id,
                scanJobId: new mongoose.Types.ObjectId(),
                sourceUrl: platform === 'youtube' 
                    ? `https://youtube.com/watch?v=${Math.random().toString(36).substring(7)}` 
                    : `https://${domain}/stream/${Math.random().toString(36).substring(7)}`,
                sourceDomain: domain,
                platform,
                matchConfidence: confidence,
                matchType: confidence > 85 ? 'exact' : 'partial',
                status,
                screenshotUrl,
                detectedAt,
                resolvedAt: status === 'resolved' ? new Date(detectedAt.getTime() + (Math.random() * 48 * 60 * 60 * 1000)) : null,
                discoveryKeyword: asset.tags[Math.floor(Math.random() * asset.tags.length)] + ' free stream',
                evidenceBundle: {
                    hammingDistance: Math.floor(Math.random() * 15),
                    colorSimilarity: 0.7 + (Math.random() * 0.25),
                    visionConfidenceBoost: confidence > 80 ? 15 : 0,
                    visionLabels: asset.title.includes('Cricket') ? ['cricket', 'stadium', 'batsman'] : ['football', 'stadium', 'goal'],
                    reasoning: 'AI Vision confirmed semantic match with broadcast elements.'
                }
            });
        }

        await Violation.insertMany(violations);
        console.log('✅ Injected historical violation data');

        // 5. Update Asset counts
        for (const asset of createdAssets) {
            const count = await Violation.countDocuments({ assetId: asset._id, orgId });
            await Asset.findByIdAndUpdate(asset._id, { violationsFound: count });
        }

        // 6. Create Recent Critical Alerts
        const criticalViolations = await Violation.find({ orgId, matchConfidence: { $gt: 90 } }).limit(5);
        const alerts = criticalViolations.map(v => ({
            orgId,
            violationId: v._id,
            type: 'high_confidence',
            severity: 'high',
            title: 'Critical Infringement Detected',
            message: `High-confidence match found on ${v.platform}. Automatic takedown notice drafted.`,
            read: false,
            createdAt: new Date()
        }));
        await Alert.insertMany(alerts);
        console.log('🔔 Created 5 Critical Demo Alerts');

        console.log('\n✨ DEMO DATA SEEDED SUCCESSFULLY!');
        console.log(`   Organization: ${org.email}`);
        console.log(`   Password: password123`);
        console.log(`   Dashboard: http://localhost:5173/login`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
