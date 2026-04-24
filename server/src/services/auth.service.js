import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { getFirebaseAdminAuth } from '../config/firebaseAdmin.js';
import Organization from '../models/organization.model.js';

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_SECRET = process.env.JWT_SECRET;

function requireJwtSecret() {
	if (!JWT_SECRET) {
		throw new Error('JWT_SECRET is not configured.');
	}
}

function normalizeEmail(email) {
	return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function getOrganizationNameFromGoogleProfile(decodedToken, email) {
	const displayName = typeof decodedToken?.name === 'string' ? decodedToken.name.trim() : '';

	if (displayName) {
		return displayName;
	}

	const localPart = normalizeEmail(email).split('@')[0] || 'Organization';
	return localPart.replace(/[._-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function decodeFirebaseTokenProjectId(idToken) {
	try {
		const [, payloadSegment] = idToken.split('.');

		if (!payloadSegment) {
			return null;
		}

		const payloadJson = Buffer.from(payloadSegment, 'base64url').toString('utf8');
		const payload = JSON.parse(payloadJson);
		return typeof payload.aud === 'string' ? payload.aud : null;
	} catch {
		return null;
	}
}

function hashToken(token) {
	return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(organization) {
	requireJwtSecret();

	return jwt.sign(
		{
			orgId: organization._id.toString(),
			email: organization.email,
			orgName: organization.orgName,
			plan: organization.plan,
			type: 'access',
		},
		JWT_SECRET,
		{ expiresIn: ACCESS_TOKEN_TTL },
	);
}

function signRefreshToken(organization) {
	requireJwtSecret();

	return jwt.sign(
		{
			orgId: organization._id.toString(),
			type: 'refresh',
		},
		JWT_SECRET,
		{ expiresIn: REFRESH_TOKEN_TTL },
	);
}

function createAuthPayload(organization) {
	const accessToken = signAccessToken(organization);
	const refreshToken = signRefreshToken(organization);

	return {
		organization: {
			id: organization._id.toString(),
			orgName: organization.orgName,
			email: organization.email,
			plan: organization.plan,
			notificationPrefs: organization.notificationPrefs,
			createdAt: organization.createdAt,
			updatedAt: organization.updatedAt,
			lastLoginAt: organization.lastLoginAt,
		},
		accessToken,
		refreshToken,
	};
}

async function findOrganizationByEmail(email) {
	return Organization.findOne({ email: normalizeEmail(email) }).select('+passwordHash +refreshTokenHash');
}

export async function loginOrganizationWithGoogle(payload = {}) {
	const idToken = typeof payload.idToken === 'string' ? payload.idToken.trim() : '';

	if (!idToken) {
		const error = new Error('Google ID token is required.');
		error.statusCode = 400;
		throw error;
	}

	let decodedToken;
	const tokenProjectId = decodeFirebaseTokenProjectId(idToken);

	try {
		decodedToken = await getFirebaseAdminAuth(tokenProjectId).verifyIdToken(idToken);
	} catch (verificationError) {
		const configuredProjectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID;
		const mismatchHint =
			tokenProjectId && configuredProjectId && tokenProjectId !== configuredProjectId
				? ` Token project: ${tokenProjectId}. Server project: ${configuredProjectId}.`
				: tokenProjectId
					? ` Token project: ${tokenProjectId}.`
					: '';
		const error = new Error(`Google sign-in token is invalid or expired.${mismatchHint}`);
		error.statusCode = 401;
		error.cause = verificationError;
		throw error;
	}

	const email = normalizeEmail(decodedToken.email);

	if (!email) {
		const error = new Error('Google account does not include an email address.');
		error.statusCode = 400;
		throw error;
	}

	if (decodedToken.email_verified === false) {
		const error = new Error('Google account email is not verified.');
		error.statusCode = 403;
		throw error;
	}

	let organization = await findOrganizationByEmail(email);

	if (!organization) {
		const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
		organization = await Organization.create({
			orgName: getOrganizationNameFromGoogleProfile(decodedToken, email),
			email,
			passwordHash,
			plan: 'free',
		});
	}

	const authPayload = createAuthPayload(organization);
	organization.refreshTokenHash = hashToken(authPayload.refreshToken);
	organization.lastLoginAt = new Date();
	await organization.save();

	return authPayload;
}

export async function registerOrganization(payload = {}) {
	const orgName = typeof payload.orgName === 'string' ? payload.orgName.trim() : '';
	const email = normalizeEmail(payload.email);
	const password = typeof payload.password === 'string' ? payload.password : '';

	const existingOrganization = await Organization.findOne({ email });

	if (existingOrganization) {
		const error = new Error('An organization with this email already exists.');
		error.statusCode = 409;
		throw error;
	}

	const passwordHash = await bcrypt.hash(password, 12);
	const organization = await Organization.create({
		orgName,
		email,
		passwordHash,
		plan: 'free',
	});

	const authPayload = createAuthPayload(organization);
	organization.refreshTokenHash = hashToken(authPayload.refreshToken);
	organization.lastLoginAt = new Date();
	await organization.save();

	return authPayload;
}

export async function loginOrganization(payload = {}) {
	const organization = await findOrganizationByEmail(payload.email);

	if (!organization) {
		const error = new Error('Invalid email or password.');
		error.statusCode = 401;
		throw error;
	}

	const isPasswordValid = await bcrypt.compare(payload.password, organization.passwordHash);

	if (!isPasswordValid) {
		const error = new Error('Invalid email or password.');
		error.statusCode = 401;
		throw error;
	}

	const authPayload = createAuthPayload(organization);
	organization.refreshTokenHash = hashToken(authPayload.refreshToken);
	organization.lastLoginAt = new Date();
	await organization.save();

	return authPayload;
}

export async function refreshOrganizationSession(refreshToken) {
	requireJwtSecret();

	if (!refreshToken) {
		const error = new Error('Refresh token is required.');
		error.statusCode = 401;
		throw error;
	}

	let decodedToken;

	try {
		decodedToken = jwt.verify(refreshToken, JWT_SECRET);
	} catch {
		const error = new Error('Refresh session is invalid or expired.');
		error.statusCode = 401;
		throw error;
	}

	if (decodedToken.type !== 'refresh') {
		const error = new Error('Invalid refresh token type.');
		error.statusCode = 401;
		throw error;
	}

	const organization = await Organization.findById(decodedToken.orgId).select('+refreshTokenHash');

	if (!organization || !organization.refreshTokenHash) {
		const error = new Error('Refresh session not found.');
		error.statusCode = 401;
		throw error;
	}

	if (organization.refreshTokenHash !== hashToken(refreshToken)) {
		const error = new Error('Refresh session was rotated or revoked.');
		error.statusCode = 401;
		throw error;
	}

	const authPayload = createAuthPayload(organization);
	organization.refreshTokenHash = hashToken(authPayload.refreshToken);
	await organization.save();

	return authPayload;
}

export async function logoutOrganization(refreshToken) {
	if (!refreshToken) {
		return;
	}

	let decodedToken;

	try {
		decodedToken = jwt.verify(refreshToken, JWT_SECRET);
	} catch {
		return;
	}

	if (!decodedToken?.orgId) {
		return;
	}

	const organization = await Organization.findById(decodedToken.orgId).select('+refreshTokenHash');

	if (!organization) {
		return;
	}

	organization.refreshTokenHash = null;
	await organization.save();
}

export async function getOrganizationById(organizationId) {
	return Organization.findById(organizationId).select('-passwordHash -refreshTokenHash');
}

export async function updateOrganizationNotificationPrefs({ organizationId, payload = {} }) {
	const normalizedPrefs = {
		emailOnHighConfidence: Boolean(payload.emailOnHighConfidence),
		emailDigest: Boolean(payload.emailDigest),
		inAppAlerts: payload.inAppAlerts === undefined ? true : Boolean(payload.inAppAlerts),
	};

	return Organization.findByIdAndUpdate(
		organizationId,
		{ notificationPrefs: normalizedPrefs },
		{ new: true },
	)
		.select('-passwordHash -refreshTokenHash')
		.lean();
}
