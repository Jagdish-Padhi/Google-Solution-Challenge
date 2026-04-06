import {
	loginOrganizationWithGoogle,
	loginOrganization,
	logoutOrganization,
	refreshOrganizationSession,
	registerOrganization,
} from '../services/auth.service.js';

const refreshCookieName = 'sportshield_refresh_token';
const refreshCookieOptions = {
	httpOnly: true,
	sameSite: 'lax',
	secure: process.env.NODE_ENV === 'production',
	path: '/',
};

function sendAuthResponse(res, statusCode, authPayload) {
	res.cookie(refreshCookieName, authPayload.refreshToken, {
		...refreshCookieOptions,
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});

	return res.status(statusCode).json({
		message: statusCode === 201 ? 'Organization registered successfully.' : 'Login successful.',
		organization: authPayload.organization,
		accessToken: authPayload.accessToken,
	});
}

export async function registerController(req, res, next) {
	try {
		const authPayload = await registerOrganization(req.body);
		return sendAuthResponse(res, 201, authPayload);
	} catch (error) {
		return next(error);
	}
}

export async function loginController(req, res, next) {
	try {
		const authPayload = await loginOrganization(req.body);
		return sendAuthResponse(res, 200, authPayload);
	} catch (error) {
		return next(error);
	}
}

export async function googleLoginController(req, res, next) {
	try {
		const authPayload = await loginOrganizationWithGoogle(req.body);
		return sendAuthResponse(res, 200, authPayload);
	} catch (error) {
		return next(error);
	}
}

export async function refreshController(req, res, next) {
	try {
		const refreshToken = req.cookies?.[refreshCookieName];
		const authPayload = await refreshOrganizationSession(refreshToken);

		return sendAuthResponse(res, 200, authPayload);
	} catch (error) {
		return next(error);
	}
}

export async function logoutController(req, res, next) {
	try {
		const refreshToken = req.cookies?.[refreshCookieName];
		await logoutOrganization(refreshToken);

		res.clearCookie(refreshCookieName, refreshCookieOptions);

		return res.status(200).json({ message: 'Logged out successfully.' });
	} catch (error) {
		return next(error);
	}
}
