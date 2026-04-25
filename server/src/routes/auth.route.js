import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
	googleLoginController,
	loginController,
	logoutController,
	refreshController,
	registerController,
} from '../controllers/auth.controller.js';
import { validateLoginPayload, validateRegisterPayload } from '../validators/auth.validator.js';

const authRouter = Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

authRouter.post('/register', authLimiter, (req, res, next) => {
	const validation = validateRegisterPayload(req.body);

	if (!validation.valid) {
		return res.status(400).json({ message: 'Invalid registration payload.', errors: validation.errors });
	}

	return registerController(req, res, next);
});

authRouter.post('/login', authLimiter, (req, res, next) => {
	const validation = validateLoginPayload(req.body);

	if (!validation.valid) {
		return res.status(400).json({ message: 'Invalid login payload.', errors: validation.errors });
	}

	return loginController(req, res, next);
});

authRouter.post('/google', authLimiter, (req, res, next) => {
	const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';

	if (!idToken) {
		return res.status(400).json({ message: 'Google ID token is required.' });
	}

	return googleLoginController(req, res, next);
});

authRouter.post('/refresh', authLimiter, (req, res, next) => refreshController(req, res, next));

authRouter.post('/logout', authLimiter, (req, res, next) => logoutController(req, res, next));

export default authRouter;
