import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

import Alert from '../models/alert.model.js';

let io;

function getClientOrigin() {
	return process.env.CLIENT_URL || 'http://localhost:5173';
}

function getSocketRoom(orgId) {
	return `org:${orgId}`;
}

function verifySocketToken(token) {
	if (!token) {
		const error = new Error('Access token is required.');
		error.statusCode = 401;
		throw error;
	}

	const decoded = jwt.verify(token, process.env.JWT_SECRET);

	if (decoded.type !== 'access') {
		const error = new Error('Invalid access token type.');
		error.statusCode = 401;
		throw error;
	}

	return decoded;
}

export function initializeRealtimeServer(server) {
	if (io) {
		return io;
	}

	io = new Server(server, {
		cors: {
			origin: getClientOrigin(),
			credentials: true,
		},
	});

	io.use((socket, next) => {
		try {
			const token = socket.handshake.auth?.token || '';
			socket.data.auth = verifySocketToken(token);
			next();
		} catch (error) {
			next(error);
		}
	});

	io.on('connection', async (socket) => {
		const orgId = socket.data.auth.orgId;
		socket.join(getSocketRoom(orgId));

		try {
			const unreadCount = await Alert.countDocuments({ orgId, read: false });
			socket.emit('alerts:unread-count', { unreadCount });
		} catch {
			socket.emit('alerts:unread-count', { unreadCount: 0 });
		}
	});

	return io;
}

export function emitAlertsCreated({ orgId, alerts, unreadCount }) {
	if (!io) {
		return;
	}

	io.to(getSocketRoom(orgId)).emit('alerts:new', {
		alerts,
		unreadCount,
	});

	io.to(getSocketRoom(orgId)).emit('alerts:unread-count', {
		unreadCount,
	});
}

export function emitAlertsUpdated({ orgId, unreadCount }) {
	if (!io) {
		return;
	}

	io.to(getSocketRoom(orgId)).emit('alerts:updated', {
		unreadCount,
	});

	io.to(getSocketRoom(orgId)).emit('alerts:unread-count', {
		unreadCount,
	});
}