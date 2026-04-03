import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
	const authorizationHeader = req.headers.authorization || '';
	const token = authorizationHeader.startsWith('Bearer ')
		? authorizationHeader.slice(7)
		: req.cookies?.accessToken;

	if (!token) {
		return res.status(401).json({ message: 'Access token is required.' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (decoded.type !== 'access') {
			return res.status(401).json({ message: 'Invalid access token type.' });
		}

		req.auth = decoded;
		return next();
	} catch {
		return res.status(401).json({ message: 'Access token is invalid or expired.' });
	}
}