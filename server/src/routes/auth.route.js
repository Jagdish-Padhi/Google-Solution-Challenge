import { Router } from 'express';

const authRouter = Router();

authRouter.post('/register', (_req, res) => {
	res.status(501).json({ message: 'Register endpoint template - not implemented yet.' });
});

authRouter.post('/login', (_req, res) => {
	res.status(501).json({ message: 'Login endpoint template - not implemented yet.' });
});

authRouter.post('/refresh', (_req, res) => {
	res.status(501).json({ message: 'Refresh endpoint template - not implemented yet.' });
});

authRouter.post('/logout', (_req, res) => {
	res.status(501).json({ message: 'Logout endpoint template - not implemented yet.' });
});

export default authRouter;