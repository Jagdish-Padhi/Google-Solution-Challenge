import { Router } from 'express';

const userRouter = Router();

userRouter.get('/me', (_req, res) => {
	res.status(501).json({ message: 'User profile endpoint template - not implemented yet.' });
});

export default userRouter;
