/**
 * Alert Component
 * Dismissible alert messages for different severity levels*/

const Alert = ({
	type = 'info',
	title = '',
	message = '',
	onClose = null,
	dismissible = true,
	icon: Icon = null,
	className = '',
	children,
}) => {
	const typeStyles = {
		success: {
			bg: 'bg-green-50',
			border: 'border-green-200',
			text: 'text-green-800',
			title: 'text-green-900',
		},
		error: {
			bg: 'bg-red-50',
			border: 'border-red-200',
			text: 'text-red-800',
			title: 'text-red-900',
		},
		warning: {
			bg: 'bg-yellow-50',
			border: 'border-yellow-200',
			text: 'text-yellow-800',
			title: 'text-yellow-900',
		},
		info: {
			bg: 'bg-blue-50',
			border: 'border-blue-200',
			text: 'text-blue-800',
			title: 'text-blue-900',
		},
	};

	const styles = typeStyles[type] || typeStyles.info;

	return (
		<div className={`${styles.bg} ${styles.border} border rounded-lg p-4 flex gap-3 ${className}`}>
			{Icon && <Icon className={`${styles.text} w-5 h-5 mt-0.5`} style={{ flexShrink: 0 }} />}

			<div className='flex-1 min-w-0'>
				{title && <h3 className={`${styles.title} font-semibold text-sm mb-1`}>{title}</h3>}
				{message && <p className={`${styles.text} text-sm`}>{message}</p>}
				{children && <div className={`${styles.text} text-sm mt-2`}>{children}</div>}
			</div>

			{dismissible && onClose && (
				<button onClick={onClose} className={`${styles.text} hover:opacity-75 transition-opacity`} style={{ flexShrink: 0 }} aria-label='Close'>
					<svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
						<path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd' />
					</svg>
				</button>
			)}
		</div>
	);
};

export default Alert;
