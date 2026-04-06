import { io } from 'socket.io-client';

let socket = null;

function getSocketUrl() {
	const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
	if (explicitSocketUrl) {
		return explicitSocketUrl;
	}

	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
	return apiBaseUrl.replace(/\/api\/?$/, '');
}

export function connectRealtime(accessToken) {
	if (!accessToken) {
		return null;
	}

	if (socket && socket.auth?.token === accessToken) {
		return socket;
	}

	if (socket) {
		socket.disconnect();
	}

	socket = io(getSocketUrl(), {
		auth: {
			token: accessToken,
		},
		withCredentials: true,
		transports: ['websocket', 'polling'],
	});

	return socket;
}

export function disconnectRealtime() {
	if (!socket) {
		return;
	}

	socket.disconnect();
	socket = null;
}

export function getRealtimeSocket() {
	return socket;
}