import { Router } from 'express';

import { verifyToken } from '../middlewares/verifyToken.js';
import { getOrganizationById } from '../services/auth.service.js';

const userRouter = Router();

userRouter.get('/me', verifyToken, async (req, res, next) => {
	try {
		const organization = await getOrganizationById(req.auth.orgId);

		if (!organization) {
			return res.status(404).json({ message: 'Organization not found.' });
		}

		return res.status(200).json({
			organization: {
				id: organization._id.toString(),
				orgName: organization.orgName,
				email: organization.email,
				plan: organization.plan,
				createdAt: organization.createdAt,
				lastLoginAt: organization.lastLoginAt,
			},
		});
	} catch (error) {
		return next(error);
	}
});

export default userRouter;
