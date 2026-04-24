import {
	getAnalyticsKPIs,
	getAnalyticsOverview,
	getAnalyticsPlatforms,
	getAnalyticsTimeline,
	getConfidenceCalibrationAnalysis,
} from '../services/analytics.service.js';
import { validateAnalyticsRangeQuery } from '../validators/analytics.validator.js';

export async function getAnalyticsOverviewController(req, res, next) {
	try {
		const { range, startDate, endDate } = validateAnalyticsRangeQuery(req.query);
		const data = await getAnalyticsOverview({
			orgId: req.auth.orgId,
			range,
			startDate,
			endDate,
		});

		return res.status(200).json(data);
	} catch (error) {
		return next(error);
	}
}

export async function getAnalyticsTimelineController(req, res, next) {
	try {
		const { range, startDate, endDate } = validateAnalyticsRangeQuery(req.query);
		const data = await getAnalyticsTimeline({
			orgId: req.auth.orgId,
			range,
			startDate,
			endDate,
		});

		return res.status(200).json(data);
	} catch (error) {
		return next(error);
	}
}

export async function getAnalyticsPlatformsController(req, res, next) {
	try {
		const { range, startDate, endDate } = validateAnalyticsRangeQuery(req.query);
		const data = await getAnalyticsPlatforms({
			orgId: req.auth.orgId,
			range,
			startDate,
			endDate,
		});

		return res.status(200).json(data);
	} catch (error) {
		return next(error);
	}
}

export async function getAnalyticsKPIsController(req, res, next) {
	try {
		const { range, startDate, endDate } = validateAnalyticsRangeQuery(req.query);
		const data = await getAnalyticsKPIs({
			orgId: req.auth.orgId,
			range,
			startDate,
			endDate,
		});

		return res.status(200).json(data);
	} catch (error) {
		return next(error);
	}
}

export async function getConfidenceCalibrationController(req, res, next) {
	try {
		const { range, startDate, endDate } = validateAnalyticsRangeQuery(req.query);
		const data = await getConfidenceCalibrationAnalysis({
			orgId: req.auth.orgId,
			range,
			startDate,
			endDate,
		});

		return res.status(200).json(data);
	} catch (error) {
		return next(error);
	}
}
