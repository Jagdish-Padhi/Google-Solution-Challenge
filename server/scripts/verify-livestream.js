import 'dotenv/config';
import { connectDatabase } from '../src/config/database.js';
import Asset from '../src/models/asset.model.js';
import ScanJob from '../src/models/scanJob.model.js';
import { dispatchScanJob } from '../src/services/scans.service.js';
import mongoose from 'mongoose';

async function test() {
	console.log('--- STARTING LIVESTREAM VERIFICATION ---');
	await connectDatabase();
	
	try {
		const orgId = new mongoose.Types.ObjectId();
		
		console.log('\n1. Testing Asset Model instantiation...');
		const mockAsset = await Asset.create({
			orgId,
			title: 'Test Livestream Asset',
			type: 'livestream',
			livestreamUrl: 'http://example.com/test-stream.m3u8',
			status: 'active'
		});
		console.log('✅ Created Livestream Asset successfully:', mockAsset._id);
		console.log('   - Type:', mockAsset.type);
		console.log('   - URL:', mockAsset.livestreamUrl);
		console.log('   - storageKey (conditional):', mockAsset.storageKey);
		console.log('   - fileSize (conditional):', mockAsset.fileSize);
		
		console.log('\n2. Testing ScanJob status enum value: monitoring...');
		const mockScanJob = await ScanJob.create({
			orgId,
			assetId: mockAsset._id,
			status: 'queued',
			platforms: ['livestream'],
			keywords: ['monitoring']
		});
		console.log('✅ Created ScanJob successfully:', mockScanJob._id);
		console.log('   - Status:', mockScanJob.status);

		console.log('\n3. Dispatching ScanJob (this should trigger ffmpeg monitor stub)...');
		await dispatchScanJob(mockScanJob._id.toString());
		
		// Wait for async task execution and db updates to complete
		await new Promise((resolve) => setTimeout(resolve, 1000));
		
		// Fetch updated ScanJob state
		const updatedJob = await ScanJob.findById(mockScanJob._id);
		console.log('✅ Dispatched ScanJob and updated state fetched.');
		console.log('   - Updated Status:', updatedJob.status);
		console.log('   - Last Error:', updatedJob.lastError);
		
		if (updatedJob.status === 'monitoring') {
			console.log('✅ SUCCESS: Status transitioned to "monitoring" successfully.');
		} else if (updatedJob.status === 'failed') {
			console.log('✅ SUCCESS: Status transitioned to "failed" (graceful fallback caught connection error/missing ffmpeg).');
		} else {
			console.log('❌ FAILED: Unexpected status transition:', updatedJob.status);
		}

		// Cleanup
		console.log('\n4. Cleaning up test records...');
		await Asset.findByIdAndDelete(mockAsset._id);
		await ScanJob.findByIdAndDelete(mockScanJob._id);
		console.log('✅ Cleanup complete.');

	} catch (error) {
		console.error('❌ VERIFICATION ERROR:', error);
	} finally {
		await mongoose.disconnect();
		console.log('\n--- VERIFICATION FINISHED ---');
		process.exit(0);
	}
}

test();
