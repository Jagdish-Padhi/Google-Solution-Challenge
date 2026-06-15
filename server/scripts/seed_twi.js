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

const TWI_ASSET_TEMPLATES = [
  {
    title: 'Lionel Messi — The Final Triumph (Miami 2026)',
    type: 'image',
    description: 'Exclusive pitchside capture of Lionel Messi holding the trophy. Protected by photographer copyright.',
    tags: ['Messi', 'Football', 'Miami', 'Action Photography'],
    storageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Virat Kohli — Classic Cover Drive (Wankhede 2025)',
    type: 'image',
    description: 'High-speed action shot highlighting the perfect wristwork and posture during a cover drive under stadium lights.',
    tags: ['Cricket', 'Virat Kohli', 'Wankhede', 'Cover Drive'],
    storageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Lewis Hamilton — Rain Masterclass (Silverstone GP)',
    type: 'image',
    description: 'Stunning spray effect capturing Lewis Hamilton navigating the wet track at Copse corner.',
    tags: ['F1', 'Lewis Hamilton', 'Silverstone', 'Motorsport'],
    storageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'LeBron James — Baseline Dunk (LA 2025)',
    type: 'image',
    description: 'Perfect mid-air capture from the baseline of LeBron James executing a signature dunk.',
    tags: ['Basketball', 'LeBron James', 'Lakers', 'Action Shot'],
    storageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Behind The Scenes — India Practice Session (Melbourne)',
    type: 'video',
    description: 'Short reel capturing the intensity of warm-up drills and team talk before the big match.',
    tags: ['Cricket', 'Behind the scenes', 'Practice', 'Team India'],
    storageUrl: 'https://storage.googleapis.com/sportshield-assets/demo/ind_aus_warmup.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Locker Room Celebrations (Mumbai Indians)',
    type: 'video',
    description: 'Exclusive footage of team dressing room champagne celebrations after clinching the title.',
    tags: ['Cricket', 'Mumbai Indians', 'Celebration', 'Exclusive'],
    storageUrl: 'https://storage.googleapis.com/sportshield-assets/demo/mi_celebration.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540747913346-19212a4b32c8?auto=format&fit=crop&q=80&w=800',
  },
];

const PLATFORMS = ['youtube', 'twitter', 'telegram', 'web'];
const DOMAINS = {
  youtube: ['youtube.com', 'youtu.be'],
  twitter: ['x.com', 'twitter.com'],
  telegram: ['t.me'],
  web: ['sportsblog.com', 'cricfree.sc', 'totalsportek.to', 'piratestream.tv', 'leakedsports.org'],
};

const MOCK_VIOLATIONS = [
  // Asset 0: Messi
  {
    assetIndex: 0,
    platform: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=mEsSi56L3Ss',
    sourceDomain: 'youtube.com',
    matchConfidence: 94,
    matchType: 'exact',
    status: 'open',
    screenshotUrl: '/evidence/football.png',
    daysAgo: 2,
    evidenceBundle: {
      hammingDistance: 2,
      colorSimilarity: 0.96,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 15,
      visionLabels: ['messi', 'trophy', 'celebration', 'jersey'],
    },
  },
  {
    assetIndex: 0,
    platform: 'twitter',
    sourceUrl: 'https://x.com/leomessifans/status/17823901928374',
    sourceDomain: 'x.com',
    matchConfidence: 89,
    matchType: 'near-duplicate',
    status: 'reported',
    screenshotUrl: '/evidence/football.png',
    daysAgo: 4,
    evidenceBundle: {
      hammingDistance: 4,
      colorSimilarity: 0.91,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 10,
      visionLabels: ['messi', 'footballer', 'celebration'],
    },
  },
  {
    assetIndex: 0,
    platform: 'web',
    sourceUrl: 'https://leakedsports.org/gallery/messi-trophy-hd',
    sourceDomain: 'leakedsports.org',
    matchConfidence: 97,
    matchType: 'exact',
    status: 'resolved',
    screenshotUrl: '/evidence/football.png',
    daysAgo: 10,
    evidenceBundle: {
      hammingDistance: 1,
      colorSimilarity: 0.98,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 15,
      visionLabels: ['messi', 'trophy', 'footballer'],
    },
  },

  // Asset 1: Virat Kohli
  {
    assetIndex: 1,
    platform: 'twitter',
    sourceUrl: 'https://x.com/cricketfans_club/status/19823901238472',
    sourceDomain: 'x.com',
    matchConfidence: 91,
    matchType: 'exact',
    status: 'open',
    screenshotUrl: '/evidence/cricket.png',
    daysAgo: 1,
    evidenceBundle: {
      hammingDistance: 3,
      colorSimilarity: 0.93,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 15,
      visionLabels: ['kohli', 'batsman', 'stadium', 'cricket'],
    },
  },
  {
    assetIndex: 1,
    platform: 'telegram',
    sourceUrl: 'https://t.me/s/crickethighlights2025/442',
    sourceDomain: 't.me',
    matchConfidence: 85,
    matchType: 'near-duplicate',
    status: 'open',
    screenshotUrl: '/evidence/cricket.png',
    daysAgo: 3,
    evidenceBundle: {
      hammingDistance: 5,
      colorSimilarity: 0.88,
      orbVerified: false,
      isMirrored: true,
      visionAvailable: true,
      visionConfidenceBoost: 5,
      visionLabels: ['cricket', 'stadium', 'batsman'],
    },
  },
  {
    assetIndex: 1,
    platform: 'web',
    sourceUrl: 'https://sportsblog.com/news/kohli-milestone-photo',
    sourceDomain: 'sportsblog.com',
    matchConfidence: 99,
    matchType: 'exact',
    status: 'licensed',
    screenshotUrl: '/evidence/cricket.png',
    daysAgo: 15,
    evidenceBundle: {
      hammingDistance: 0,
      colorSimilarity: 1.0,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 15,
      visionLabels: ['kohli', 'cricket', 'sports'],
    },
  },

  // Asset 2: Lewis Hamilton
  {
    assetIndex: 2,
    platform: 'web',
    sourceUrl: 'https://totalsportek.to/f1/silverstone-highlights',
    sourceDomain: 'totalsportek.to',
    matchConfidence: 92,
    matchType: 'exact',
    status: 'open',
    screenshotUrl: '/evidence/generic.png',
    daysAgo: 5,
    evidenceBundle: {
      hammingDistance: 2,
      colorSimilarity: 0.95,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 15,
      visionLabels: ['formula one', 'race car', 'track'],
    },
  },
  {
    assetIndex: 2,
    platform: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=f1lhRaincopse',
    sourceDomain: 'youtube.com',
    matchConfidence: 45,
    matchType: 'partial',
    status: 'false_positive',
    screenshotUrl: '/evidence/generic.png',
    daysAgo: 8,
    evidenceBundle: {
      hammingDistance: 15,
      colorSimilarity: 0.55,
      orbVerified: false,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 0,
      visionLabels: ['car', 'rainy street'],
    },
  },

  // Asset 3: LeBron James
  {
    assetIndex: 3,
    platform: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=lebrondunkla25',
    sourceDomain: 'youtube.com',
    matchConfidence: 95,
    matchType: 'exact',
    status: 'open',
    screenshotUrl: '/evidence/generic.png',
    daysAgo: 3,
    evidenceBundle: {
      hammingDistance: 2,
      colorSimilarity: 0.97,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 15,
      visionLabels: ['lebron james', 'basketball', 'dunk', 'stadium'],
    },
  },
  {
    assetIndex: 3,
    platform: 'twitter',
    sourceUrl: 'https://x.com/nbalive_clips/status/1982739182374',
    sourceDomain: 'x.com',
    matchConfidence: 87,
    matchType: 'near-duplicate',
    status: 'reported',
    screenshotUrl: '/evidence/generic.png',
    daysAgo: 6,
    evidenceBundle: {
      hammingDistance: 6,
      colorSimilarity: 0.89,
      orbVerified: true,
      isMirrored: true,
      visionAvailable: true,
      visionConfidenceBoost: 10,
      visionLabels: ['basketball', 'dunk'],
    },
  },

  // Asset 4: BTS Video
  {
    assetIndex: 4,
    platform: 'telegram',
    sourceUrl: 'https://t.me/s/exclusive_cricket_leaks/89',
    sourceDomain: 't.me',
    matchConfidence: 88,
    matchType: 'near-duplicate',
    status: 'open',
    screenshotUrl: '/evidence/cricket.png',
    daysAgo: 2,
    evidenceBundle: {
      hammingDistance: 6,
      colorSimilarity: 0.89,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 10,
      visionLabels: ['cricket', 'stadium', 'warmup'],
    },
  },
  {
    assetIndex: 4,
    platform: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=btsIndiaPractice',
    sourceDomain: 'youtube.com',
    matchConfidence: 96,
    matchType: 'exact',
    status: 'resolved',
    screenshotUrl: '/evidence/cricket.png',
    daysAgo: 12,
    evidenceBundle: {
      hammingDistance: 2,
      colorSimilarity: 0.96,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 15,
      visionLabels: ['cricket', 'practice', 'stadium'],
    },
  },

  // Asset 5: Locker Room Video
  {
    assetIndex: 5,
    platform: 'web',
    sourceUrl: 'https://piratestream.tv/vid/mi-dressing-room',
    sourceDomain: 'piratestream.tv',
    matchConfidence: 93,
    matchType: 'exact',
    status: 'open',
    screenshotUrl: '/evidence/cricket.png',
    daysAgo: 4,
    evidenceBundle: {
      hammingDistance: 3,
      colorSimilarity: 0.94,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 15,
      visionLabels: ['locker room', 'celebration', 'cricketers'],
    },
  },
];

async function seedTwi() {
  try {
    console.log('🚀 Starting Photographer Demo Seeding for twi123@gmail.com...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Password hash for "password123"
    const passwordHash = '$2b$12$o8/UIs.UxIhqtzxx6eMI6.qlUVw/Dg10xc8HaRDF2QK5lVItpFCsy';

    let org = await Organization.findOne({ email: 'twi123@gmail.com' });
    if (org) {
      console.log('ℹ️ Found existing twi123@gmail.com organization. Deleting previous assets and violations for a clean seed...');
      const orgId = org._id;

      // Clean up previous seed data associated with this user
      await Asset.deleteMany({ orgId });
      await Violation.deleteMany({ orgId });
      await Alert.deleteMany({ orgId });
      await ScanJob.deleteMany({ orgId });
      await ScanResult.deleteMany({ orgId });

      // Update basic fields to ensure it is in creator/photographer mode
      org.orgName = 'Twi Sports Photography';
      org.userType = 'creator';
      org.plan = 'pro';
      org.passwordHash = passwordHash;
      await org.save();
      console.log('✅ Updated existing Organization and password to Photographer View');
    } else {
      console.log('ℹ️ Organization twi123@gmail.com not found. Creating it...');
      org = await Organization.create({
        orgName: 'Twi Sports Photography',
        email: 'twi123@gmail.com',
        passwordHash,
        plan: 'pro',
        userType: 'creator',
        notificationPrefs: {
          emailOnHighConfidence: true,
          emailDigest: true,
          inAppAlerts: true,
        },
        members: [
          { email: 'twi123@gmail.com', role: 'admin', inviteStatus: 'active', joinedAt: new Date() }
        ],
      });
      console.log('✅ Created New Organization: twi123@gmail.com');
    }

    const orgId = org._id;
    const now = new Date();

    // 1. Create Assets
    const createdAssets = [];
    for (let i = 0; i < TWI_ASSET_TEMPLATES.length; i++) {
      const template = TWI_ASSET_TEMPLATES[i];
      const asset = await Asset.create({
        orgId,
        title: template.title,
        type: template.type,
        description: template.description,
        tags: template.tags,
        status: 'active',
        violationsFound: 0,
        storageKey: `assets/${orgId}/twi_${i}${template.type === 'video' ? '.mp4' : '.jpg'}`,
        storageUrl: template.storageUrl,
        thumbnailUrl: template.thumbnailUrl,
        fileSize: template.type === 'video' ? 18000000 : 3200000,
        fingerprint: {
          pHash: Math.random().toString(16).substring(2, 18),
          colorHistogram: Array.from({ length: 64 }, () => Math.random()),
          frameHashes: template.type === 'video' ? ['v1v1', 'v2v2', 'v3v3'] : [],
        },
        createdAt: new Date(now.getTime() - (i + 5) * 4 * 24 * 60 * 60 * 1000),
        uploadedAt: new Date(now.getTime() - (i + 5) * 4 * 24 * 60 * 60 * 1000),
      });
      createdAssets.push(asset);
    }
    console.log(`✅ Created ${createdAssets.length} Photographer Assets`);

    // 2. Create Scan Jobs
    const scanJobs = [];
    for (const asset of createdAssets) {
      const startedAt = new Date(asset.createdAt.getTime() + 10 * 60 * 1000);
      const completedAt = new Date(startedAt.getTime() + 5 * 60 * 1000);
      const job = await ScanJob.create({
        orgId,
        assetId: asset._id,
        status: 'completed',
        platforms: PLATFORMS,
        keywords: [asset.tags[0].toLowerCase(), asset.tags[1].toLowerCase(), 'copyright', 'repost'],
        resultsCount: 25,
        violationsCount: 0, // updated below
        startedAt,
        completedAt,
      });
      scanJobs.push(job);
    }
    console.log(`✅ Created Scan Jobs for all assets`);

    // 3. Create Violations
    const violationDocs = [];
    for (const v of MOCK_VIOLATIONS) {
      const asset = createdAssets[v.assetIndex];
      const job = scanJobs[v.assetIndex];
      const detectedAt = new Date(now.getTime() - v.daysAgo * 24 * 60 * 60 * 1000);

      violationDocs.push({
        orgId,
        assetId: asset._id,
        scanJobId: job._id,
        platform: v.platform,
        sourceUrl: v.sourceUrl,
        sourceDomain: v.sourceDomain,
        matchConfidence: v.matchConfidence,
        matchType: v.matchType,
        status: v.status,
        screenshotUrl: v.screenshotUrl,
        detectedAt,
        resolvedAt: v.status === 'resolved' ? new Date(detectedAt.getTime() + 24 * 60 * 60 * 1000) : null,
        discoveryKeyword: asset.tags[0] + ' photo',
        evidenceBundle: v.evidenceBundle,
        repeatOffenderScore: Math.floor(Math.random() * 40),
      });
    }

    const insertedViolations = await Violation.insertMany(violationDocs);
    console.log(`✅ Injected ${insertedViolations.length} Photographer Violations`);

    // 4. Update Violations Count in Assets and ScanJobs
    for (const asset of createdAssets) {
      const count = await Violation.countDocuments({ assetId: asset._id, orgId });
      await Asset.findByIdAndUpdate(asset._id, { violationsFound: count });
    }
    for (const job of scanJobs) {
      const count = await Violation.countDocuments({ scanJobId: job._id, orgId });
      await ScanJob.findByIdAndUpdate(job._id, { violationsCount: count });
    }
    console.log('✅ Updated Asset and ScanJob violation metrics');

    // 5. Create scan results for each job
    const scanResults = [];
    for (const job of scanJobs) {
      const asset = createdAssets.find(a => a._id.toString() === job.assetId.toString());
      // Create some normal scan results
      for (let r = 0; r < 5; r++) {
        const platform = PLATFORMS[r % PLATFORMS.length];
        const domains = DOMAINS[platform];
        const domain = domains[r % domains.length];
        const confidence = 30 + Math.floor(Math.random() * 40);

        scanResults.push({
          scanJobId: job._id,
          orgId,
          assetId: asset._id,
          sourceUrl: `https://${domain}/post/${Math.random().toString(36).substring(7)}`,
          sourceDomain: domain,
          platform,
          pageTitle: `Unauthorized share of ${asset.title}`,
          status: 'no_match',
          matchConfidence: confidence,
          matchType: 'partial',
          scrapedAt: new Date(job.completedAt.getTime() - 2 * 60000),
          evidenceBundle: {
            hammingDistance: 12 + Math.floor(Math.random() * 10),
            colorSimilarity: Number((0.4 + Math.random() * 0.2).toFixed(2)),
          },
        });
      }
    }
    await ScanResult.insertMany(scanResults);
    console.log(`✅ Seeded Scan Results for all Scan Jobs`);

    // 6. Create Alerts for High Confidence open violations
    const openViolations = await Violation.find({ orgId, status: 'open', matchConfidence: { $gte: 90 } });
    const alertDocs = openViolations.map((v, i) => {
      const asset = createdAssets.find(a => a._id.toString() === v.assetId.toString());
      return {
        orgId,
        violationId: v._id,
        type: 'high_confidence',
        severity: 'high',
        title: `Critical copyright infringement found`,
        message: `High confidence match (${v.matchConfidence}%) for "${asset.title}" detected on ${v.platform}. Action recommended.`,
        read: i > 1, // Make first two unread
        createdAt: new Date(v.detectedAt.getTime() + 5000),
      };
    });
    await Alert.insertMany(alertDocs);
    console.log(`✅ Created ${alertDocs.length} Alerts for High Confidence Infringements`);

    console.log('\n✨ DEMO DATA SEEDED SUCCESSFULLY FOR PHOTOGRAPHER VIEW!');
    console.log('------------------------------------------------------------');
    console.log(`Email:    twi123@gmail.com`);
    console.log(`Password: password123`);
    console.log(`UserType: creator (Photographer)`);
    console.log(`Assets:   ${createdAssets.length} (images & videos)`);
    console.log(`Findings: ${insertedViolations.length} total violations`);
    console.log('------------------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedTwi();
