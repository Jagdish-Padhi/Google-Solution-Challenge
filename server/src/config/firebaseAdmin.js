import fs from 'node:fs';

import admin from 'firebase-admin';

function isConfiguredValue(value) {
	return Boolean(value && !String(value).startsWith('your_'));
}

function getServiceAccountFromFile() {
	const serviceAccountFileUrl = new URL('./serviceAccountKey.json', import.meta.url);

	if (!fs.existsSync(serviceAccountFileUrl)) {
		return null;
	}

	return JSON.parse(fs.readFileSync(serviceAccountFileUrl, 'utf8'));
}

function getServiceAccountFromEnv() {
	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
	}

	if (
		process.env.FIREBASE_PROJECT_ID &&
		process.env.FIREBASE_CLIENT_EMAIL &&
		process.env.FIREBASE_PRIVATE_KEY
	) {
		return {
			projectId: process.env.FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
		};
	}

	return null;
}

function buildAppName(projectId) {
	return projectId ? `firebase-admin-${projectId}` : '[DEFAULT]';
}

function initializeFirebaseAdmin(projectId) {
	const serviceAccount = getServiceAccountFromFile() || getServiceAccountFromEnv();
	const resolvedProjectId = isConfiguredValue(projectId)
		? projectId
		: isConfiguredValue(process.env.FIREBASE_PROJECT_ID)
			? process.env.FIREBASE_PROJECT_ID
			: isConfiguredValue(process.env.GOOGLE_CLOUD_PROJECT_ID)
				? process.env.GOOGLE_CLOUD_PROJECT_ID
				: undefined;
	const appName = buildAppName(resolvedProjectId);

	try {
		return admin.app(appName);
	} catch {
		// App doesn't exist yet, so we initialize it below.
	}

	if (serviceAccount) {
		const serviceAccountWithProject =
			resolvedProjectId && !serviceAccount.projectId
				? { ...serviceAccount, projectId: resolvedProjectId }
				: serviceAccount;

		return admin.initializeApp(
			{
				credential: admin.credential.cert(serviceAccountWithProject),
				projectId: resolvedProjectId || serviceAccountWithProject.projectId,
			},
			appName,
		);
	}

	if (!resolvedProjectId) {
		throw new Error(
			'Firebase Admin project ID is not configured. Set FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT_ID, or provide Firebase service account credentials.',
		);
	}

	return admin.initializeApp(
		{
			projectId: resolvedProjectId,
		},
		appName,
	);
}

export function getFirebaseAdminAuth(projectId) {
	return initializeFirebaseAdmin(projectId).auth();
}

export default admin;
