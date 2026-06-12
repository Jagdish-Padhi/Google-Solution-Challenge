import EventEmitter from 'node:events';

// Stub activeMonitors and livestreamReconnects maps
const activeMonitors = new Map();
const livestreamReconnects = new Map();

// Mock database storage
const db = {
	scanJobs: {
		"mock-job-id": {
			_id: "mock-job-id",
			status: "monitoring",
			progress: 10,
			save: async function() {
				console.log(`[DB MOCK] Saved ScanJob status: ${this.status}`);
			}
		}
	}
};

// Mock ScanJob Model
const ScanJob = {
	findById: async (id) => {
		return db.scanJobs[id];
	},
	findByIdAndUpdate: async (id, update) => {
		const job = db.scanJobs[id];
		if (job) {
			Object.assign(job, update);
			console.log(`[DB MOCK] findByIdAndUpdate: status set to ${job.status}, error set to ${job.lastError}`);
		}
		return job;
	}
};

const markScanJobFailed = async (id, errorMsg) => {
	await ScanJob.findByIdAndUpdate(id, { status: 'failed', lastError: errorMsg });
};

// Mock spawn function to simulate ffmpeg
let currentFfmpegInstance = null;
let simulatedCloseCode = -2; // Default to simulating a connection error / abnormal exit

function mockSpawn(cmd, args) {
	console.log(`[SPAWN MOCK] Spawning ${cmd} with args:`, args);
	const ffmpegMock = new EventEmitter();
	ffmpegMock.stdout = new EventEmitter();
	ffmpegMock.stderr = new EventEmitter();
	ffmpegMock.kill = (sig) => {
		console.log(`[FFMPEG MOCK] killed with signal ${sig}`);
		// Trigger normal exit
		ffmpegMock.emit('close', null);
	};

	currentFfmpegInstance = ffmpegMock;
	return ffmpegMock;
}

// Stub processLiveStreamFrame
const processLiveStreamFrame = (jpegFrame, scanJob, asset) => {
	console.log("[FRAME MOCK] Processing frame bytes...");
};

// Replicated monitorLiveStream function matching scans.service.js
async function monitorLiveStream(scanJob, asset) {
	const jobIdStr = scanJob._id.toString();
	
	// Initialize reconnect count if not present
	if (!livestreamReconnects.has(jobIdStr)) {
		livestreamReconnects.set(jobIdStr, 0);
	}
	
	const attempt = livestreamReconnects.get(jobIdStr);

	try {
		// Only update status and clear errors on initial launch
		if (attempt === 0) {
			scanJob.status = 'monitoring';
			scanJob.progress = 10;
			scanJob.startedAt = new Date();
			scanJob.lastError = null;
			await scanJob.save();
		}

		console.log(`[LIVESTREAM MONITOR] Starting ffmpeg capture for scanJob ${jobIdStr} (attempt ${attempt + 1}/5)`);

		// Spawn ffmpeg child process to capture a frame from the live stream every 1.5 seconds:
		const ffmpeg = mockSpawn('ffmpeg', [
			'-i', asset.livestreamUrl,
			'-vf', 'fps=1/1.5',
			'-f', 'image2pipe',
			'-vcodec', 'mjpeg',
			'-'
		]);

		activeMonitors.set(jobIdStr, ffmpeg);

		let dataBuffer = Buffer.alloc(0);
		
		ffmpeg.stdout.on('data', async (chunk) => {
			// On successful data intake, reset reconnect attempt counter because the connection is alive!
			if (livestreamReconnects.get(jobIdStr) > 0) {
				livestreamReconnects.set(jobIdStr, 0);
			}
			
			dataBuffer = Buffer.concat([dataBuffer, chunk]);
			while (true) {
				const startIndex = dataBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
				if (startIndex === -1) {
					dataBuffer = dataBuffer.slice(Math.max(0, dataBuffer.length - 1));
					break;
				}
				const endIndex = dataBuffer.indexOf(Buffer.from([0xFF, 0xD9]), startIndex + 2);
				if (endIndex === -1) {
					break;
				}
				const jpegFrame = dataBuffer.slice(startIndex, endIndex + 2);
				dataBuffer = dataBuffer.slice(endIndex + 2);

				// Process JPEG frame in background
				void processLiveStreamFrame(jpegFrame, scanJob, asset);
			}
		});

		const handleDisconnect = async (reason, detail) => {
			activeMonitors.delete(jobIdStr);
			
			// Verify if the job is still active in the database
			const freshJob = await ScanJob.findById(scanJob._id);
			if (freshJob && freshJob.status === 'monitoring') {
				const currentAttempt = livestreamReconnects.get(jobIdStr) || 0;
				if (currentAttempt < 4) {
					livestreamReconnects.set(jobIdStr, currentAttempt + 1);
					const backoffMs = 500; // Fast retry for tests
					console.warn(`[LIVESTREAM DISCONNECT] ${reason} (${detail}). Reconnecting in ${backoffMs / 1000}s (Attempt ${currentAttempt + 1}/5)...`);
					setTimeout(() => {
						void monitorLiveStream(scanJob, asset);
					}, backoffMs);
				} else {
					console.error(`[LIVESTREAM FAILED] Max connection attempts (5/5) reached for scanJob ${jobIdStr}`);
					livestreamReconnects.delete(jobIdStr);
					await markScanJobFailed(scanJob._id, `Stream disconnected: Max reconnect attempts reached. (${detail})`);
				}
			} else {
				livestreamReconnects.delete(jobIdStr);
			}
		};

		ffmpeg.on('error', async (err) => {
			console.error(`[FFMPEG ERROR] Failed to start ffmpeg process for scanJob ${jobIdStr}:`, err);
			void handleDisconnect('ffmpeg process error', err.message);
		});

		ffmpeg.stderr.on('data', (data) => {
			const logStr = data.toString();
			if (logStr.toLowerCase().includes('error') || logStr.toLowerCase().includes('fail')) {
				console.warn(`[FFMPEG STDERR] ${logStr.trim()}`);
			}
		});

		ffmpeg.on('close', async (code) => {
			if (code !== 0 && code !== null) {
				console.error(`[FFMPEG CLOSE] ffmpeg process for scanJob ${jobIdStr} exited with code ${code}`);
				void handleDisconnect('ffmpeg process closed unexpectedly', `exit code ${code}`);
			} else {
				// Clean exit (e.g. killed by SIGKILL)
				activeMonitors.delete(jobIdStr);
				livestreamReconnects.delete(jobIdStr);
			}
		});

	} catch (error) {
		activeMonitors.delete(jobIdStr);
		console.error(`[MONITOR_LIVE_STREAM_ERROR] Exception in monitorLiveStream for scanJob ${jobIdStr}:`, error);
		await markScanJobFailed(scanJob._id, error.message);
	}
}

// Test Runner
async function runTests() {
	console.log("=== TEST 1: Simulate stream exit with code -2 (reconnect attempts) ===");
	const mockJob = db.scanJobs["mock-job-id"];
	const mockAsset = { livestreamUrl: "rtmp://mock-source.com/live" };

	await monitorLiveStream(mockJob, mockAsset);

	// Simulate ffmpeg exiting with code -2 for several attempts
	for (let i = 1; i <= 5; i++) {
		await new Promise(resolve => setTimeout(resolve, 100)); // wait for spawn print
		console.log(`\n--- Simulating ffmpeg exit for attempt ${i} ---`);
		const currentFfmpeg = currentFfmpegInstance;
		currentFfmpeg.emit('close', -2);
		await new Promise(resolve => setTimeout(resolve, 600)); // wait for reconnect delay (500ms)
	}

	// Verify that ScanJob status is now "failed"
	console.log("\nFinal ScanJob state after test 1:", mockJob.status, "Last error:", mockJob.lastError);
	if (mockJob.status === 'failed') {
		console.log("✅ TEST 1 PASSED: Transited to failed state after 5 unsuccessful reconnection attempts.");
	} else {
		console.error("❌ TEST 1 FAILED: Unexpected state:", mockJob.status);
	}

	console.log("\n=== TEST 2: Simulate successful data reception (resets reconnect count) ===");
	mockJob.status = "monitoring"; // reset
	livestreamReconnects.delete("mock-job-id"); // reset
	await monitorLiveStream(mockJob, mockAsset);

	await new Promise(resolve => setTimeout(resolve, 100));
	// Simulate 2 failed connections
	console.log("\n--- Failure 1 ---");
	currentFfmpegInstance.emit('close', -2);
	await new Promise(resolve => setTimeout(resolve, 600));

	console.log("\n--- Failure 2 ---");
	currentFfmpegInstance.emit('close', -2);
	await new Promise(resolve => setTimeout(resolve, 600));

	console.log(`Current reconnect count (should be 2): ${livestreamReconnects.get("mock-job-id")}`);

	// Now simulate data arrival
	console.log("\n--- Data received ---");
	currentFfmpegInstance.stdout.emit('data', Buffer.from([0xFF, 0xD8, 0x01, 0x02, 0xFF, 0xD9]));
	await new Promise(resolve => setTimeout(resolve, 100));
	console.log(`Reconnect count after data (should be reset to 0): ${livestreamReconnects.get("mock-job-id")}`);
	
	if (livestreamReconnects.get("mock-job-id") === 0) {
		console.log("✅ TEST 2 PASSED: Reconnect counter reset successfully.");
	} else {
		console.error("❌ TEST 2 FAILED");
	}

	console.log("\n=== TEST 3: Simulate explicit user stop (normal exit code null) ===");
	// Simulate kill
	console.log("\n--- Killing ffmpeg via user stop ---");
	currentFfmpegInstance.kill('SIGKILL');
	await new Promise(resolve => setTimeout(resolve, 100));
	console.log("Reconnect count (should be undefined):", livestreamReconnects.get("mock-job-id"));
	console.log("Is monitor active? (should be false):", activeMonitors.has("mock-job-id"));

	if (!activeMonitors.has("mock-job-id") && !livestreamReconnects.has("mock-job-id")) {
		console.log("✅ TEST 3 PASSED: Explicit stop terminates cleanly without reconnect loop.");
	} else {
		console.error("❌ TEST 3 FAILED");
	}
}

runTests();
