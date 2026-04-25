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

const seedData = async () => {
	try {
		console.log('Connecting to MongoDB...');
		await mongoose.connect(MONGO_URI);
		console.log('Connected.');

		// 1. Clear existing data
		console.log('Clearing existing data...');
		await Promise.all([
			Organization.deleteMany({ email: 'demo@sportshield.com' }),
			// Note: We only delete for the demo org if it exists to avoid wiping others, 
			// but for a clean seed we'll clear related data by orgId later.
		]);

		// 2. Create Demo Organization
		console.log('Creating demo organization...');
		const passwordHash = await bcrypt.hash('SportShield@123', 10);
		const demoOrg = await Organization.create({
			orgName: 'SportShield Global Rights',
			email: 'demo@sportshield.com',
			passwordHash,
			plan: 'pro',
		});

		const orgId = demoOrg._id;

		// 3. Create Sports Assets
		console.log('Seeding assets...');
		const assets = await Asset.insertMany([
			{
				orgId,
				title: 'UEFA Champions League Final: Real Madrid vs Dortmund',
				type: 'highlight',
				storageKey: 'ucl_final_2024_highlights',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/ucl_highlights.mp4',
				thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
				status: 'active',
				fileSize: 157286400, // 150MB
				fingerprint: {
					pHash: 'a1b2c3d4e5f6g7h8',
					videoHash: 'v1v2v3v4v5v6v7v8',
					colorHistogram: [0.1, 0.2, 0.5, 0.2],
				},
				violationsFound: 12,
			},
			{
				orgId,
				title: 'NBA Finals: Lakers vs Celtics Game 7',
				type: 'video',
				storageKey: 'nba_finals_game7_full',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/nba_finals.mp4',
				thumbnailUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
				status: 'active',
				fileSize: 2147483648, // 2GB
				fingerprint: {
					pHash: 'z9y8x7w6v5u4t3s2',
					videoHash: 'n1b2a3f4i5n6a7l8',
					colorHistogram: [0.3, 0.1, 0.4, 0.2],
				},
				violationsFound: 8,
			},
			{
				orgId,
				title: 'Wimbledon Men\'s Final: Match Point',
				type: 'highlight',
				storageKey: 'wimbledon_2024_match_point',
				gcsUrl: 'https://res.cloudinary.com/diqmfvdzi/video/upload/v1714030000/demo/wimbledon.mp4',
				thumbnailUrl: 'https://images.unsplash.com/photo-1595435064212-362677840449?auto=format&fit=crop&q=80&w=800',
				status: 'active',
				fileSize: 52428800, // 50MB
				fingerprint: {
					pHash: 'w1i2m3b4l5e6d7o8',
					videoHash: 't1e2n3n4i5s6h7a8',
				},
				violationsFound: 5,
			},
		]);

		// 4. Create Scan Jobs
		console.log('Seeding scan jobs...');
		const scanJobs = await ScanJob.insertMany([
			{
				orgId,
				assetId: assets[0]._id,
				status: 'completed',
				platforms: ['youtube', 'twitter', 'telegram', 'web'],
				keywords: ['UCL final 2024 highlights', 'Real Madrid vs Dortmund live stream'],
				resultsCount: 45,
				violationsCount: 12,
				startedAt: new Date(Date.now() - 86400000), // 1 day ago
				completedAt: new Date(Date.now() - 86400000 + 300000), // 5 mins later
			},
			{
				orgId,
				assetId: assets[1]._id,
				status: 'completed',
				platforms: ['youtube', 'web'],
				keywords: ['NBA finals game 7 full', 'Lakers Celtics stream free'],
				resultsCount: 28,
				violationsCount: 8,
				startedAt: new Date(Date.now() - 43200000), // 12 hours ago
				completedAt: new Date(Date.now() - 43200000 + 450000), // 7.5 mins later
			},
		]);

		// 5. Create Violations
		console.log('Seeding violations...');
		const violations = await Violation.insertMany([
			{
				orgId,
				assetId: assets[0]._id,
				scanJobId: scanJobs[0]._id,
				platform: 'telegram',
				sourceUrl: 'https://t.me/live_sports_streams_hd/1024',
				sourceDomain: 't.me',
				matchConfidence: 94.5,
				matchType: 'exact',
				status: 'open',
				screenshotUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800', // Abstract digital piracy look
				evidenceBundle: {
					hammingDistance: 2,
					colorSimilarity: 0.98,
					frameMatchCount: 15,
				},
				detectedAt: new Date(Date.now() - 80000000),
			},
			{
				orgId,
				assetId: assets[0]._id,
				scanJobId: scanJobs[0]._id,
				platform: 'youtube',
				sourceUrl: 'https://youtube.com/watch?v=pirate_ucl_highlights',
				sourceDomain: 'youtube.com',
				matchConfidence: 88.2,
				matchType: 'near-duplicate',
				status: 'reported',
				screenshotUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800', // Crowd/stadium look
				evidenceBundle: {
					hammingDistance: 8,
					colorSimilarity: 0.92,
					frameMatchCount: 12,
				},
				detectedAt: new Date(Date.now() - 75000000),
			},
			{
				orgId,
				assetId: assets[1]._id,
				scanJobId: scanJobs[1]._id,
				platform: 'web',
				sourceUrl: 'https://vipleague.st/basketball/nba-finals-replay-free',
				sourceDomain: 'vipleague.st',
				matchConfidence: 76.4,
				matchType: 'partial',
				status: 'open',
				screenshotUrl: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800', // Basketball court
				evidenceBundle: {
					hammingDistance: 12,
					colorSimilarity: 0.85,
				},
				detectedAt: new Date(Date.now() - 40000000),
			},
			{
				orgId,
				assetId: assets[2]._id,
				scanJobId: scanJobs[0]._id,
				platform: 'twitter',
				sourceUrl: 'https://x.com/sports_leaks/status/123456789',
				sourceDomain: 'x.com',
				matchConfidence: 92.1,
				matchType: 'exact',
				status: 'resolved',
				resolvedAt: new Date(),
				screenshotUrl: 'https://images.unsplash.com/photo-1595435064212-362677840449?auto=format&fit=crop&q=80&w=800', // Tennis
				evidenceBundle: {
					hammingDistance: 3,
					colorSimilarity: 0.95,
				},
				detectedAt: new Date(Date.now() - 30000000),
			},
		]);

		// 6. Create Alerts
		console.log('Seeding alerts...');
		await Alert.insertMany([
			{
				orgId,
				violationId: violations[0]._id,
				type: 'high_confidence',
				severity: 'critical',
				title: 'Critical Infringement Detected',
				message: 'High-confidence match found on Telegram for "UCL Final Highlights".',
				channels: ['in-app', 'email'],
			},
			{
				orgId,
				violationId: violations[2]._id,
				type: 'new_violation',
				severity: 'high',
				title: 'New Piracy Source Found',
				message: 'A new domain "vipleague.st" is hosting your NBA content.',
				channels: ['in-app'],
			},
		]);

		console.log('\n✅ Seeding completed successfully!');
		console.log('-----------------------------------');
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
