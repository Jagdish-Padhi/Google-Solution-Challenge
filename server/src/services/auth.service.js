import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

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
