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
import ScanResult from '../src/models/scanResult.model.js';

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

// Real discoverable piracy/unofficial stream URLs for demo realism
// These are real pages that load and demonstrate the kind of content SportShield detects
const realViolationUrls = {
	youtube: [
		{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'UCL Final 2024 Highlights [UNOFFICIAL]' },
		{ url: 'https://www.youtube.com/watch?v=9bZkp7q19f0', title: 'NBA Finals Game 7 Full Match Free' },
		{ url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', title: 'Champions League Goals Compilation' },
		{ url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8', title: 'IPL 2024 Best Moments Watch Free' },
		{ url: 'https://www.youtube.com/watch?v=hT_nvWreIhg', title: 'Olympics 100m Sprint Full Replay' },
		{ url: 'https://www.youtube.com/watch?v=OPf0YbXqDm0', title: 'Man City Kit 24/25 Unofficial Review' },
	],
	twitter: [
		{ url: 'https://x.com/search?q=ucl+final+live+stream+free', title: 'UCL Final Live Free Streaming Links' },
		{ url: 'https://x.com/search?q=nba+finals+watch+free', title: 'NBA Finals Watch Free Twitter Thread' },
		{ url: 'https://x.com/search?q=champions+league+pirate+stream', title: 'Champions League Unofficial Stream' },
		{ url: 'https://x.com/search?q=ipl+free+stream+2024', title: 'IPL 2024 Free Stream - Twitter' },
		{ url: 'https://x.com/search?q=sports+highlights+leaked', title: 'Leaked Sports Highlights - Twitter' },
	],
	web: [
		{ url: 'https://www.reddit.com/r/soccerstreams', title: 'Reddit SoccerStreams - Free UCL Streams' },
		{ url: 'https://www.reddit.com/r/nbastreams', title: 'Reddit NBA Streams - Watch Free' },
		{ url: 'https://archive.org/search?query=sports+highlights', title: 'Archive.org Unauthorized Sports Uploads' },
		{ url: 'https://vimeo.com/search?q=ucl+final', title: 'Vimeo UCL Final Unauthorized Upload' },
		{ url: 'https://vimeo.com/search?q=nba+finals+highlights', title: 'Vimeo NBA Finals Unofficial Highlights' },
		{ url: 'https://www.dailymotion.com/search/ucl+final+2024', title: 'Dailymotion UCL Final Free Watch' },
		{ url: 'https://www.dailymotion.com/search/nba+finals+highlights', title: 'Dailymotion NBA Finals Full Match' },
		{ url: 'https://www.facebook.com/watch/search/?q=ucl+final+stream', title: 'Facebook UCL Final Live Stream' },
	],
	telegram: [
		{ url: 'https://t.me/s/sportsstreams', title: 'Telegram Sports Streams Channel' },
		{ url: 'https://t.me/s/freesportslinks', title: 'Telegram Free Sports Links Group' },
		{ url: 'https://t.me/s/footballstreams24', title: 'Telegram Football Streams 24/7' },
	],
};

const domains = ['youtube.com', 'x.com', 't.me', 'reddit.com', 'vimeo.com', 'dailymotion.com', 'facebook.com', 'archive.org'];
const highRiskDomains = ['t.me', 'reddit.com', 'vimeo.com', 'dailymotion.com']; // Repeat offenders

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
				ScanResult.deleteMany({ orgId }),
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
				// Football/soccer stadium & match - verified Unsplash ID
				thumbnailUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'NBA Finals: Lakers vs Celtics Game 7',
				description: 'Full match recording of the historic NBA Finals Game 7. Includes official broadcast graphics, commentary audio tracks, and halftime show. Extremely high-value asset strictly monitored for unauthorized re-streaming.',
				type: 'video',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/nba.mp4',
				// Basketball game action - verified Unsplash ID
				thumbnailUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: "Wimbledon Men's Final Match Point",
				description: "The defining match point of the Wimbledon Men's Singles Final. Short-form clip highly susceptible to social media piracy (Twitter/X and Telegram). Protected by All England Lawn Tennis Club.",
				type: 'highlight',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/tennis.mp4',
				// Tennis player serving on grass court - verified Unsplash ID
				thumbnailUrl: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'UFC 300: Heavyweight Championship Knockout',
				description: 'Pay-per-view main event knockout sequence from UFC 300. This 30-second clip is the most highly pirated segment of the event. Monitored strictly across Reddit, Telegram, and illegal IPTV streams.',
				type: 'highlight',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/ufc.mp4',
				// MMA / boxing gloves - verified Unsplash ID
				thumbnailUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'Formula 1: Red Bull RB20 Official Reveal',
				description: 'Pre-season confidential imagery of the Red Bull Racing RB20 aerodynamics package. High risk of industrial espionage and unauthorized publication by independent motorsport blogs.',
				type: 'image',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/image/upload/v1714030000/demo/f1.jpg',
				// Formula 1 race car on track - verified Unsplash ID
				thumbnailUrl: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'ICC Cricket World Cup 2024 Official Promo Poster',
				description: 'High-resolution promotional artwork for the ICC T20 World Cup. Frequently used without license by unauthorized ticket resellers and unverified merchandise manufacturers.',
				type: 'image',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/image/upload/v1714030000/demo/cricket.jpg',
				// Cricket match, batsman hitting - verified Unsplash ID
				thumbnailUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'Manchester City Official Home Kit 24/25',
				description: 'Licensed apparel imagery used for counterfeit detection. The PHash and color histogram of this asset are actively matched against suspected fake merchandise listings on e-commerce platforms.',
				type: 'image',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/image/upload/v1714030000/demo/jersey.jpg',
				// Sports jersey / kit on hanger - verified Unsplash ID
				thumbnailUrl: 'https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?auto=format&fit=crop&q=80&w=800',
			},
			{
				title: 'Player Exclusive Sneaker Release (Merch)',
				description: 'Unreleased limited-edition player signature sneaker. Monitored strictly to prevent pre-release leaks and unauthorized manufacturing by overseas counterfeit operations.',
				type: 'image',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/image/upload/v1714030000/demo/sneaker.jpg',
				// Sports sneaker close-up - verified Unsplash ID
				thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
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

			// Pick a real URL from the pool based on platform
			const urlPool = realViolationUrls[platform] || realViolationUrls.web;
			const pickedUrl = randomElement(urlPool);

			violationData.push({
				orgId,
				assetId: asset._id,
				scanJobId: scanJob._id,
				platform,
				sourceUrl: pickedUrl.url,
				sourceDomain: new URL(pickedUrl.url).hostname,
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
				repeatOffenderScore: highRiskDomains.includes(new URL(pickedUrl.url).hostname) ? randomInt(50, 95) : randomInt(0, 30)
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

		// 6. Create ScanResult records so the results page shows discovered URLs
		const pageTitles = [
			'UCL Final 2024 Full Match Free Watch',
			'NBA Finals Game 7 Live Stream',
			'Watch Football Free Online HD',
			'Pirate Sports Stream Tonight',
			'Live Sport Free Crackstream',
			'Man City Kit Replica Buy Cheap',
			'Bootleg Jersey Shop Online',
			'Watch Champions League Free',
			'IPL Live Streaming Free 2024',
			'Olympics Highlights Unlisted Upload',
		];
		const scanResultData = [];
		for (const job of scanJobs) {
			const asset = assets.find(a => a._id.toString() === job.assetId.toString());
			const resultCount = randomInt(4, 12);
			for (let r = 0; r < resultCount; r++) {
				const platform = randomElement(Object.keys(realViolationUrls));
				const urlPool = realViolationUrls[platform];
				const pickedUrl = randomElement(urlPool);
				const confidence = randomInt(35, 99);
				const resultStatus = confidence > 85 ? 'matched' : confidence < 50 ? 'no_match' : 'pending_match';
				scanResultData.push({
					scanJobId: job._id,
					orgId,
					assetId: asset._id,
					sourceUrl: pickedUrl.url,
					sourceDomain: new URL(pickedUrl.url).hostname,
					platform,
					pageTitle: pickedUrl.title,
					status: resultStatus,
					matchConfidence: confidence,
					matchType: confidence > 90 ? 'exact' : confidence > 70 ? 'near-duplicate' : 'partial',
					scrapedAt: new Date(job.completedAt.getTime() - randomInt(0, 120000)),
					evidenceBundle: {
						hammingDistance: randomInt(0, 20),
						colorSimilarity: Number((Math.random() * 0.5 + 0.5).toFixed(2)),
					},
				});
			}
		}
		await ScanResult.insertMany(scanResultData);

		// 7. Create Alerts (Spikes and High Confidence)
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
		console.log(`Seeded 1 Org, ${assets.length} Assets, ${scanJobs.length} Scans, ${scanResultData.length} Results, ${violations.length} Violations, ${alertData.length} Alerts.`);
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
