import {
	createScheduledScanJobsForOrg,
	createScanJob,
	dispatchScanJob,
	getScanJobById,
	listScanResultsByJob,
	listScanJobsByOrg,
	retryScanJob,
} from '../services/scans.service.js';
import {
	validateListScanResultsQuery,
	validateListScansQuery,
	validateStartScanPayload,
} from '../validators/scans.validator.js';

export async function startScanController(req, res, next) {
	try {
		const { assetId, keywords, platforms, multiLanguage } = validateStartScanPayload(req.body);

		const scanJob = await createScanJob({
			orgId: req.auth.orgId,
			assetId,
			keywords,
			platforms,
			multiLanguage,
		});

		void dispatchScanJob(scanJob._id.toString());

		return res.status(201).json({
			message: 'Scan job created successfully.',
			scanJobId: scanJob._id.toString(),
			status: scanJob.status,
		});
	} catch (error) {
		return next(error);
	}
}

export async function getScanStatusController(req, res, next) {
	try {
		const scanJob = await getScanJobById({
			orgId: req.auth.orgId,
			scanJobId: req.params.jobId,
		});

		if (!scanJob) {
			return res.status(404).json({ message: 'Scan job not found.' });
		}

		return res.status(200).json({ scanJob });
	} catch (error) {
		return next(error);
	}
}

export async function listScansController(req, res, next) {
	try {
		const { page, limit, status, platform } = validateListScansQuery(req.query);
		const result = await listScanJobsByOrg({ orgId: req.auth.orgId, page, limit, status, platform });

		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function listScanResultsController(req, res, next) {
	try {
		const { page, limit, status, platform } = validateListScanResultsQuery(req.query);
		const result = await listScanResultsByJob({
			orgId: req.auth.orgId,
			scanJobId: req.params.jobId,
			page,
			limit,
			status,
			platform,
		});

		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function retryScanController(req, res, next) {
	try {
		const scanJob = await retryScanJob({
			orgId: req.auth.orgId,
			scanJobId: req.params.jobId,
		});

		void dispatchScanJob(scanJob._id.toString());

		return res.status(200).json({
			message: 'Scan job re-queued successfully.',
			scanJobId: scanJob._id.toString(),
			status: scanJob.status,
		});
	} catch (error) {
		return next(error);
	}
}

export async function runScheduledScansNowController(req, res, next) {
	try {
		const jobs = await createScheduledScanJobsForOrg(req.auth.orgId);

		return res.status(201).json({
			message: 'Scheduled scans queued successfully.',
			queuedJobs: jobs.length,
			jobIds: jobs.map((job) => job._id.toString()),
		});
	} catch (error) {
		return next(error);
	}
}