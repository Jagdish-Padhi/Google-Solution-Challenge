import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import Organization from '../src/models/organization.model.js';
import Asset from '../src/models/asset.model.js';
import Violation from '../src/models/violation.model.js';
import ScanJob from '../src/models/scanJob.model.js';
import Alert from '../src/models/alert.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
	console.error('MONGO_URI is missing in .env');
	process.exit(1);
}

// Helpers for random generation
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (startDaysAgo, endDaysAgo) => {
	const end = new Date();
	end.setDate(end.getDate() - endDaysAgo);
	const start = new Date();
	start.setDate(start.getDate() - startDaysAgo);
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const platforms = ['youtube', 'twitter', 'telegram', 'web'];
const domains = ['youtube.com', 'x.com', 't.me', 'vipleague.st', 'crackstreams.me', 'reddit.com', 'facebook.com', 'piratebay.org', 'sportsurge.net'];
const highRiskDomains = ['vipleague.st', 'crackstreams.me', 't.me', 'sportsurge.net']; // Repeat offenders

const seedData = async () => {
	try {
		console.log('Connecting to MongoDB...');
		await mongoose.connect(MONGO_URI);
		console.log('Connected.');

		// 1. Clear existing data for demo org
		console.log('Clearing existing demo data...');
		const existingOrg = await Organization.findOne({ email: 'demo@sportshield.com' });
		if (existingOrg) {
			const orgId = existingOrg._id;
			await Promise.all([
				Asset.deleteMany({ orgId }),
				ScanJob.deleteMany({ orgId }),
				Violation.deleteMany({ orgId }),
				Alert.deleteMany({ orgId }),
				Organization.deleteOne({ _id: orgId })
			]);
		}

		// 2. Create Demo Organization
		console.log('Creating demo organization...');
		const passwordHash = await bcrypt.hash('SportShield@123', 10);
		const demoOrg = await Organization.create({
			orgName: 'SportShield Global Rights',
			email: 'demo@sportshield.com',
			passwordHash,
			plan: 'pro',
			createdAt: randomDate(45, 45) // Org created 45 days ago
		});
		const orgId = demoOrg._id;

		// 3. Create Broad Variety of Assets
		console.log('Seeding diverse sports assets...');
		const assetData = [
			{
				title: 'UEFA Champions League Final: Real Madrid vs Dortmund',
				description: 'Official 4K broadcast highlights of the 2024 UEFA Champions League Final. Contains exclusive multi-angle camera feeds, post-match celebrations, and official trophy lift. Protected under UEFA Global Rights division.',
				type: 'video',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/ucl.mp4',
				thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'NBA Finals: Lakers vs Celtics Game 7',
				description: 'Full match recording of the historic NBA Finals Game 7. Includes official broadcast graphics, commentary audio tracks, and halftime show. Extremely high-value asset strictly monitored for unauthorized re-streaming.',
				type: 'video',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/nba.mp4',
				thumbnailUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'Wimbledon Men\'s Final Match Point',
				description: 'The defining match point of the Wimbledon Men\'s Singles Final. Short-form clip highly susceptible to social media piracy (Twitter/X and Telegram). Protected by All England Lawn Tennis Club.',
				type: 'highlight',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/tennis.mp4',
				thumbnailUrl: 'https://images.unsplash.com/photo-1595435064212-362677840449?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'UFC 300: Heavyweight Championship Knockout',
				description: 'Pay-per-view main event knockout sequence from UFC 300. This 30-second clip is the most highly pirated segment of the event. Monitored strictly across Reddit, Telegram, and illegal IPTV streams.',
				type: 'highlight',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/ufc.mp4',
				thumbnailUrl: 'https://images.unsplash.com/photo-1591550215446-240e8a7161b3?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'Formula 1: Red Bull RB20 Official Reveal',
				description: 'Pre-season confidential imagery of the Red Bull Racing RB20 aerodynamics package. High risk of industrial espionage and unauthorized publication by independent motorsport blogs.',
				type: 'image',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/image/upload/v1714030000/demo/f1.jpg',
				thumbnailUrl: 'https://images.unsplash.com/photo-1532983330958-4b32bb398e2c?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'ICC Cricket World Cup 2024 Official Promo Poster',
				description: 'High-resolution promotional artwork for the ICC T20 World Cup. Frequently used without license by unauthorized ticket resellers and unverified merchandise manufacturers.',
				type: 'image',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/image/upload/v1714030000/demo/cricket.jpg',
				thumbnailUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'Manchester City Official Home Kit 24/25',
				description: 'Licensed apparel imagery used for counterfeit detection. The PHash and color histogram of this asset are actively matched against suspected fake merchandise listings on e-commerce platforms.',
				type: 'image',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/image/upload/v1714030000/demo/jersey.jpg',
				thumbnailUrl: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'Player Exclusive Sneaker Release (Merch)',
				description: 'Unreleased limited-edition player signature sneaker. Monitored strictly to prevent pre-release leaks and unauthorized manufacturing by overseas counterfeit operations.',
				type: 'image',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/image/upload/v1714030000/demo/sneaker.jpg',
				thumbnailUrl: 'https://images.unsplash.com/photo-1552346154-21d32810baa3?auto=format&fit=crop&q=80&w=800',
			}
		];

		const assets = await Asset.insertMany(assetData.map((data, index) => ({
			orgId,
			...data,
			storageKey: `demo_asset_${index}`,
			status: 'active',
			createdAt: new Date(Date.now() - (index * 86400000 * 5)), // Make videos (first items) the newest
			fileSize: data.type === 'video' ? randomInt(100, 2000) * 1024 * 1024 : randomInt(1, 10) * 1024 * 1024,
			fingerprint: {
				pHash: Math.random().toString(16).substring(2, 18),
				videoHash: data.type !== 'image' ? Math.random().toString(16).substring(2, 18) : undefined,
				colorHistogram: [Math.random(), Math.random(), Math.random(), Math.random()],
			},
			violationsFound: 0 // Will update later
		})));

		// 4. Create Historical Scan Jobs
		console.log('Seeding 30-day historical scan jobs...');
		const scanJobsData = [];
		for (let i = 0; i < 40; i++) {
			const asset = randomElement(assets);
			const startedAt = randomDate(1, 30);
			const durationMins = randomInt(2, 15);
			const completedAt = new Date(startedAt.getTime() + durationMins * 60000);
			
			scanJobsData.push({
				orgId,
				assetId: asset._id,
				status: 'completed',
				platforms: [randomElement(platforms), randomElement(platforms)],
				keywords: [`${asset.title.split(' ')[0]} live`, `watch ${asset.title.split(' ')[1]} free`],
				resultsCount: randomInt(10, 150),
				violationsCount: 0, // Will update later
				startedAt,
				completedAt
			});
		}
		const scanJobs = await ScanJob.insertMany(scanJobsData);

		// 5. Create Realistic Violations (100+ over 30 days)
		console.log('Seeding 100+ realistic violations across all cases...');
		const violationData = [];
		const assetViolationCounts = {};
		const scanViolationCounts = {};

		for (let i = 0; i < 120; i++) {
			const scanJob = randomElement(scanJobs);
			const asset = assets.find(a => a._id.toString() === scanJob.assetId.toString());
			const detectedAt = new Date(scanJob.completedAt.getTime() - randomInt(0, 60000));
			
			// Simulate Repeat Offenders (60% chance to pick from highRiskDomains)
			const domain = Math.random() > 0.4 ? randomElement(highRiskDomains) : randomElement(domains);
			const platform = domain === 'youtube.com' ? 'youtube' : domain === 'x.com' ? 'twitter' : domain === 't.me' ? 'telegram' : 'web';
			
			// Realistic statuses
			const statusRand = Math.random();
			let status = 'open';
			let resolvedAt = null;
			let matchConfidence = randomInt(40, 99);
			let matchType = matchConfidence > 90 ? 'exact' : matchConfidence > 70 ? 'near-duplicate' : 'partial';

			if (statusRand < 0.15) {
				status = 'false_positive';
				matchConfidence = randomInt(30, 60);
				matchType = 'partial';
			} else if (statusRand < 0.35) {
				status = 'resolved';
				// SLA Realistic: Resolved 2 to 48 hours after detection
				resolvedAt = new Date(detectedAt.getTime() + randomInt(2, 48) * 3600000);
			} else if (statusRand < 0.5) {
				status = 'reported';
			}

			// Generate screenshots based on asset type
			const screenshotUrl = asset.thumbnailUrl;

			violationData.push({
				orgId,
				assetId: asset._id,
				scanJobId: scanJob._id,
				platform,
				sourceUrl: `https://${domain}/watch/${Math.random().toString(36).substring(7)}`,
				sourceDomain: domain,
				matchConfidence,
				matchType,
				status,
				resolvedAt,
				screenshotUrl,
				evidenceBundle: {
					hammingDistance: randomInt(0, 15),
					colorSimilarity: Number((Math.random() * 0.5 + 0.5).toFixed(2)),
					frameMatchCount: asset.type !== 'image' ? randomInt(1, 20) : undefined,
				},
				detectedAt,
				repeatOffenderScore: highRiskDomains.includes(domain) ? randomInt(50, 95) : randomInt(0, 30)
			});

			// Accumulate counts
			assetViolationCounts[asset._id] = (assetViolationCounts[asset._id] || 0) + 1;
			scanViolationCounts[scanJob._id] = (scanViolationCounts[scanJob._id] || 0) + 1;
		}

		const violations = await Violation.insertMany(violationData);

		// Update counts in Assets and ScanJobs
		for (const asset of assets) {
			await Asset.findByIdAndUpdate(asset._id, { violationsFound: assetViolationCounts[asset._id] || 0 });
		}
		for (const job of scanJobs) {
			await ScanJob.findByIdAndUpdate(job._id, { violationsCount: scanViolationCounts[job._id] || 0 });
		}

		// 6. Create Alerts (Spikes and High Confidence)
		console.log('Seeding strategic alerts...');
		const alertData = [];
		const highConfViolations = violations.filter(v => v.matchConfidence >= 90 && v.status === 'open').slice(0, 15);
		
		for (const v of highConfViolations) {
			alertData.push({
				orgId,
				violationId: v._id,
				type: 'high_confidence',
				severity: 'critical',
				title: 'Critical Infringement Detected',
				message: `Exact match found on ${v.platform} with ${v.matchConfidence}% confidence.`,
				channels: ['in-app', 'email'],
				read: Math.random() > 0.5,
				createdAt: new Date(v.detectedAt.getTime() + 2000)
			});
		}

		// Simulate a platform surge alert
		alertData.push({
			orgId,
			type: 'platform_surge',
			severity: 'high',
			title: 'Telegram Piracy Surge',
			message: 'Detected 12 new violations on Telegram within the last hour.',
			channels: ['in-app'],
			read: false,
			createdAt: randomDate(1, 2)
		});

		await Alert.insertMany(alertData);

		console.log('\n✅ ROBUST SEEDING COMPLETED SUCCESSFULLY!');
		console.log('-----------------------------------');
		console.log(`Seeded 1 Org, ${assets.length} Assets, ${scanJobs.length} Scans, ${violations.length} Violations, ${alertData.length} Alerts.`);
		console.log('Demo Credentials:');
		console.log('Email: demo@sportshield.com');
		console.log('Password: SportShield@123');
		console.log('-----------------------------------');

		process.exit(0);
	} catch (error) {
		console.error('Seeding failed:', error);
		process.exit(1);
	}
};

seedData();
