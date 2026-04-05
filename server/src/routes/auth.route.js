import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { googleAuthController } from '../controllers/auth.controller.js';
import {
	loginController,
	logoutController,
	refreshController,
	registerController,
} from '../controllers/auth.controller.js';
import { validateLoginPayload, validateRegisterPayload } from '../validators/auth.validator.js';

const authRouter = Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
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

authRouter.post('/refresh', authLimiter, (req, res, next) => refreshController(req, res, next));
//Google signup Route
authRouter.post('/google', authLimiter, googleAuthController);

authRouter.post('/logout', authLimiter, (req, res, next) => logoutController(req, res, next));

export default authRouter;