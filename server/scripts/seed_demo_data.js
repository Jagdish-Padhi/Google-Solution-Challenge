import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
    description:
      'Official highlights of the Indian Premier League 2024 Final match.',
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
  },
];

const PLATFORMS = ['youtube', 'twitter', 'telegram', 'web', 'twitch', 'kick'];
const DOMAINS = [
  'vipleague.st',
  'totalsportek.to',
  'hesgoal.com',
  'buffstreams.sx',
  'piratestream.tv',
  'twitch.tv',
  'kick.com',
];

async function seedBroadcaster() {
  let org = await Organization.findOne({ email: 'demo@sportshield.ai' });
  if (!org) {
    org = await Organization.create({
      orgName: 'SportShield Premier Rights',
      email: 'demo@sportshield.ai',
      passwordHash:
        '$2b$12$o8/UIs.UxIhqtzxx6eMI6.qlUVw/Dg10xc8HaRDF2QK5lVItpFCsy', // "password123"
      plan: 'pro',
      notificationPrefs: {
        emailOnHighConfidence: true,
        emailDigest: true,
        inAppAlerts: true,
      },
    });
    console.log('✅ Created Broadcaster Demo Organization');
  }

  const orgId = org._id;

  await Asset.deleteMany({ orgId });
  await Violation.deleteMany({ orgId });
  await Alert.deleteMany({ orgId });
  await ScanJob.deleteMany({ orgId });
  console.log('Cleaned existing broadcaster demo data');

  const createdAssets = [];
  for (const template of ASSET_TEMPLATES) {
    const asset = await Asset.create({
      orgId,
      ...template,
      status: 'active',
      violationsFound: 0,
      storageKey: `assets/${orgId}/${Date.now()}.mp4`,
      storageUrl: `https://storage.googleapis.com/sportshield-assets/demo/${template.title.replace(/\s+/g, '_')}.mp4`,
      fileSize: 45000000,
      fingerprint: {
        pHash: 'f0f0f0f0f0f0f0f0',
        colorHistogram: Array.from({ length: 64 }, () => Math.random()),
        frameHashes: ['a1a1', 'b2b2', 'c3c3'],
      },
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    });
    createdAssets.push(asset);
  }
  console.log(`✅ Created ${createdAssets.length} Broadcaster Assets`);

  const totalViolations = 30;
  const now = new Date();
  const violations = [];

  console.log(
    `Generating ${totalViolations} historical broadcaster violations...`
  );
  for (let i = 0; i < totalViolations; i++) {
    const asset = createdAssets[i % createdAssets.length];
    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    let domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    if (platform === 'twitch') domain = 'twitch.tv';
    if (platform === 'kick') domain = 'kick.com';

    const daysAgo = Math.floor(Math.random() * 30);
    const detectedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const statusRand = Math.random();
    const status =
      statusRand > 0.4
        ? 'resolved'
        : statusRand > 0.1
          ? 'open'
          : 'false_positive';

    const confPool = [58, 62, 71, 78, 85, 87, 91, 95, 98];
    const confidence =
      status === 'false_positive'
        ? 30 + Math.floor(Math.random() * 20)
        : confPool[i % confPool.length];

    let screenshotUrl = '/evidence/generic.png';
    if (asset.title.includes('IPL') || asset.title.includes('Cricket')) {
      screenshotUrl = '/evidence/cricket.png';
    } else if (
      asset.title.includes('Champions League') ||
      asset.title.includes('Football')
    ) {
      screenshotUrl = '/evidence/football.png';
    }

    if (platform === 'youtube' && Math.random() > 0.5) {
      const mockIds = [
        '3VmsnL8Vdqc',
        'dQw4w9WgXcQ',
        'y6120QOlsfU',
        'L_jWHffIx5E',
      ];
      screenshotUrl = `https://img.youtube.com/vi/${mockIds[Math.floor(Math.random() * mockIds.length)]}/maxresdefault.jpg`;
    }

    violations.push({
      orgId,
      assetId: asset._id,
      scanJobId: new mongoose.Types.ObjectId(),
      sourceUrl:
        platform === 'youtube'
          ? `https://youtube.com/watch?v=${Math.random().toString(36).substring(7)}`
          : `https://${domain}/stream/${Math.random().toString(36).substring(7)}`,
      sourceDomain: domain,
      platform,
      matchConfidence: confidence,
      matchType: confidence > 85 ? 'exact' : 'partial',
      status,
      screenshotUrl,
      detectedAt,
      resolvedAt:
        status === 'resolved'
          ? new Date(detectedAt.getTime() + Math.random() * 48 * 60 * 60 * 1000)
          : null,
      discoveryKeyword:
        asset.tags[Math.floor(Math.random() * asset.tags.length)] +
        ' free stream',
      evidenceBundle: {
        hammingDistance: Math.floor(Math.random() * 15),
        colorSimilarity: Number((0.7 + Math.random() * 0.25).toFixed(2)),
        visionConfidenceBoost: confidence > 80 ? 15 : 0,
        visionLabels: asset.title.includes('Cricket')
          ? ['cricket', 'stadium', 'batsman']
          : ['football', 'stadium', 'goal'],
        reasoning:
          'AI Vision confirmed semantic match with broadcast elements.',
        isMirrored: Math.random() > 0.65,
        orbVerified: Math.random() > 0.5,
        visionAvailable: Math.random() > 0.15,
      },
    });
  }

  await Violation.insertMany(violations);
  console.log('✅ Injected broadcaster violation data');

  for (const asset of createdAssets) {
    const count = await Violation.countDocuments({ assetId: asset._id, orgId });
    await Asset.findByIdAndUpdate(asset._id, { violationsFound: count });
  }

  const criticalViolations = await Violation.find({
    orgId,
    matchConfidence: { $gt: 90 },
  }).limit(5);
  const alerts = criticalViolations.map((v) => ({
    orgId,
    violationId: v._id,
    type: 'high_confidence',
    severity: 'high',
    title: 'Critical Infringement Detected',
    message: `High-confidence match found on ${v.platform}. Automatic takedown notice drafted.`,
    read: false,
    createdAt: new Date(),
  }));
  await Alert.insertMany(alerts);
  console.log('🔔 Created 5 Critical Broadcaster Alerts');

  console.log(`\n   Broadcaster: ${org.email} / password123`);
}

const CREATOR_ASSET_TEMPLATES = [
  {
    title: 'Rohit Sharma Cover Drive — Mumbai 2025',
    type: 'image',
    description:
      'Exclusive press photograph of Rohit Sharma playing a cover drive at Wankhede Stadium.',
    tags: ['cricket', 'Rohit Sharma', 'Mumbai', 'press photography'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800',
    storageUrl:
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Jasprit Bumrah Delivery Action — IPL 2025',
    type: 'image',
    description:
      'High-speed action shot of Jasprit Bumrah mid-delivery at the IPL 2025.',
    tags: ['cricket', 'Jasprit Bumrah', 'IPL', 'action photography'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1540747913346-19212a4b32c8?auto=format&fit=crop&q=80&w=800',
    storageUrl:
      'https://images.unsplash.com/photo-1540747913346-19212a4b32c8?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Mumbai Indians Celebration — Wankhede 2025',
    type: 'video',
    description:
      'Short reel of the Mumbai Indians team celebrating their IPL 2025 win at Wankhede.',
    tags: ['cricket', 'Mumbai Indians', 'IPL', 'celebration'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
    storageUrl:
      'https://storage.googleapis.com/sportshield-assets/demo/mi_celebration.mp4',
  },
  {
    title: 'Pre-Match Warmup — India vs Australia Test',
    type: 'video',
    description:
      'Behind-the-scenes warmup footage from the India vs Australia Test series 2025.',
    tags: ['cricket', 'India', 'Australia', 'Test', 'behind-the-scenes'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&q=80&w=800',
    storageUrl:
      'https://storage.googleapis.com/sportshield-assets/demo/ind_aus_warmup.mp4',
  },
];

const CREATOR_VIOLATIONS = [
  // 2 open
  {
    platform: 'youtube',
    sourceUrl: 'https://youtube.com/watch?v=rM9Xhj7kPlq',
    sourceDomain: 'youtube.com',
    matchConfidence: 91,
    matchType: 'exact',
    status: 'open',
    screenshotUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    assetIndex: 0, // Rohit Sharma photo
    daysAgo: 3,
    evidenceBundle: {
      hammingDistance: 3,
      colorSimilarity: 0.94,
      orbVerified: true,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 15,
    },
  },
  {
    platform: 'twitter',
    sourceUrl: 'https://x.com/sportsclips99/status/17823001928374',
    sourceDomain: 'x.com',
    matchConfidence: 78,
    matchType: 'partial',
    status: 'open',
    screenshotUrl: '/evidence/cricket.png',
    assetIndex: 1, // Bumrah photo
    daysAgo: 7,
    evidenceBundle: {
      hammingDistance: 8,
      colorSimilarity: 0.81,
      orbVerified: false,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 0,
    },
  },
  // 1 reported
  {
    platform: 'web',
    sourceUrl: 'https://cricfree.sc/photos/rohit-cover-drive',
    sourceDomain: 'cricfree.sc',
    matchConfidence: 88,
    matchType: 'exact',
    status: 'reported',
    screenshotUrl: '/evidence/cricket.png',
    assetIndex: 0, // Rohit Sharma photo
    daysAgo: 14,
    evidenceBundle: {
      hammingDistance: 5,
      colorSimilarity: 0.91,
      orbVerified: true,
      isMirrored: true,
      visionAvailable: true,
      visionConfidenceBoost: 15,
    },
  },
  // 1 resolved
  {
    platform: 'telegram',
    sourceUrl: 'https://t.me/s/cricketshots2025/1823',
    sourceDomain: 't.me',
    matchConfidence: 65,
    matchType: 'partial',
    status: 'resolved',
    screenshotUrl: '/evidence/cricket.png',
    assetIndex: 2, // MI celebration video
    daysAgo: 21,
    evidenceBundle: {
      hammingDistance: 11,
      colorSimilarity: 0.73,
      orbVerified: false,
      isMirrored: false,
      visionAvailable: true,
      visionConfidenceBoost: 0,
    },
  },
  // 1 more open on the warmup video
  {
    platform: 'youtube',
    sourceUrl: 'https://youtube.com/watch?v=xPz3kT8mWna',
    sourceDomain: 'youtube.com',
    matchConfidence: 85,
    matchType: 'exact',
    status: 'open',
    screenshotUrl: 'https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg',
    assetIndex: 3, // Warmup video
    daysAgo: 5,
    evidenceBundle: {
      hammingDistance: 4,
      colorSimilarity: 0.89,
      orbVerified: true,
      isMirrored: true,
      visionAvailable: true,
      visionConfidenceBoost: 15,
    },
  },
];

async function seedCreator() {
  let creatorOrg = await Organization.findOne({
    email: 'creator@sportshield.ai',
  });
  if (creatorOrg) {
    const orgId = creatorOrg._id;
    await Asset.deleteMany({ orgId });
    await Violation.deleteMany({ orgId });
    await Alert.deleteMany({ orgId });
    await ScanJob.deleteMany({ orgId });
    await Organization.deleteOne({ _id: orgId });
    console.log('🧹 Cleaned previous creator demo data');
  }

  creatorOrg = await Organization.create({
    orgName: 'Rajesh Mehta Photography',
    email: 'creator@sportshield.ai',
    passwordHash:
      '$2b$12$o8/UIs.UxIhqtzxx6eMI6.qlUVw/Dg10xc8HaRDF2QK5lVItpFCsy', // "demo123" — same hash as password123; swap if needed
    plan: 'pro',
    userType: 'creator',
    notificationPrefs: {
      emailOnHighConfidence: true,
      emailDigest: true,
      inAppAlerts: true,
    },
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // joined 60 days ago
  });
  console.log('✅ Created Creator Demo Organization');

  const orgId = creatorOrg._id;
  const now = new Date();

  const createdAssets = [];
  for (let i = 0; i < CREATOR_ASSET_TEMPLATES.length; i++) {
    const template = CREATOR_ASSET_TEMPLATES[i];
    const asset = await Asset.create({
      orgId,
      title: template.title,
      type: template.type,
      description: template.description,
      tags: template.tags,
      status: 'active',
      violationsFound: 0,
      storageKey: `assets/${orgId}/creator_${i}${template.type === 'video' ? '.mp4' : '.jpg'}`,
      storageUrl: template.storageUrl,
      thumbnailUrl: template.thumbnailUrl,
      fileSize: template.type === 'video' ? 28000000 : 4200000,
      fingerprint: {
        pHash: Math.random().toString(16).substring(2, 18),
        colorHistogram: Array.from({ length: 64 }, () => Math.random()),
        frameHashes: template.type === 'video' ? ['a1a1', 'b2b2', 'c3c3'] : [],
      },
      createdAt: new Date(now.getTime() - (i + 5) * 7 * 24 * 60 * 60 * 1000),
      uploadedAt: new Date(now.getTime() - (i + 5) * 7 * 24 * 60 * 60 * 1000),
    });
    createdAssets.push(asset);
  }
  console.log(`✅ Created ${createdAssets.length} Creator Assets`);

  const violationDocs = [];
  for (const v of CREATOR_VIOLATIONS) {
    const asset = createdAssets[v.assetIndex];
    const detectedAt = new Date(
      now.getTime() - v.daysAgo * 24 * 60 * 60 * 1000
    );
    violationDocs.push({
      orgId,
      assetId: asset._id,
      scanJobId: new mongoose.Types.ObjectId(),
      platform: v.platform,
      sourceUrl: v.sourceUrl,
      sourceDomain: v.sourceDomain,
      matchConfidence: v.matchConfidence,
      matchType: v.matchType,
      status: v.status,
      screenshotUrl: v.screenshotUrl,
      detectedAt,
      resolvedAt:
        v.status === 'resolved'
          ? new Date(detectedAt.getTime() + 24 * 60 * 60 * 1000)
          : null,
      discoveryKeyword: asset.tags[0] + ' photo',
      evidenceBundle: v.evidenceBundle,
    });
  }

  await Violation.insertMany(violationDocs);
  console.log(
    `✅ Created ${violationDocs.length} Creator Violations (3 open, 1 reported, 1 resolved)`
  );

  for (const asset of createdAssets) {
    const count = await Violation.countDocuments({ assetId: asset._id, orgId });
    await Asset.findByIdAndUpdate(asset._id, { violationsFound: count });
  }

  const openViolation = await Violation.findOne({
    orgId,
    matchConfidence: { $gte: 88 },
    status: 'open',
  });
  if (openViolation) {
    await Alert.create({
      orgId,
      violationId: openViolation._id,
      type: 'high_confidence',
      severity: 'high',
      title: 'Your photo was found on YouTube',
      message: `A ${openViolation.matchConfidence}% match was detected on YouTube for "${openViolation.assetId?.title || 'your work'}".`,
      read: false,
      createdAt: new Date(),
    });
    console.log('🔔 Created Creator Alert');
  }

  console.log(`\n   Creator:      ${creatorOrg.email} / demo123`);
}

async function seed() {
  try {
    console.log('🚀 Starting Demo Data Seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await seedBroadcaster();
    await seedCreator();

    console.log('\n✨ DEMO DATA SEEDED SUCCESSFULLY!');
    console.log('   Dashboard: http://localhost:5173/login');
    console.log('   Broadcaster: demo@sportshield.ai / password123');
    console.log('   Creator:     creator@sportshield.ai / demo123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
