/**
 * Toast/Notification Component
 * Display temporary notifications at the bottom of the screen
 * Use with a global toast manager context
 */

import { useEffect } from 'react';

const Toast = ({
	type = 'info',
	message = '',
	duration = 5000,
	onClose,
	id,
	className = '',
}) => {
	useEffect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => onClose(id), duration);
			return () => clearTimeout(timer);
		}
	}, [duration, id, onClose]);

	const typeStyles = {
		success: {
			bg: 'bg-green-50',
			border: 'border-green-200',
			text: 'text-green-800',
			icon: '✓',
			iconBg: 'bg-green-100',
		},
		error: {
			bg: 'bg-red-50',
			border: 'border-red-200',
			text: 'text-red-800',
			icon: '✕',
			iconBg: 'bg-red-100',
		},
		warning: {
			bg: 'bg-yellow-50',
			border: 'border-yellow-200',
			text: 'text-yellow-800',
			icon: '⚠',
			iconBg: 'bg-yellow-100',
		},
		info: {
			bg: 'bg-blue-50',
			border: 'border-blue-200',
			text: 'text-blue-800',
			icon: 'ℹ',
			iconBg: 'bg-blue-100',
		},
	};

	const styles = typeStyles[type] || typeStyles.info;

	return (
		<div className={`${styles.bg} ${styles.border} border rounded-lg p-4 flex gap-4 items-start max-w-md animate-in fade-in slide-in-from-bottom ${className}`}>
			<div className={`${styles.iconBg} rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 ${styles.text} font-bold`}>{styles.icon}</div>
			<p className={`${styles.text} text-sm flex-1`}>{message}</p>
			<button onClick={() => onClose(id)} className={`${styles.text} opacity-50 hover:opacity-100 transition-opacity flex-shrink-0`}>
				<svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
					<path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd' />
				</svg>
			</button>
		</div>
	);
};

export default Toast;
