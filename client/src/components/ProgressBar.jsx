/**
 * ProgressBar Component
 * Visual progress indicator
 */

const ProgressBar = ({
	value = 0,
	max = 100,
	size = 'md',
	color = 'primary',
	showLabel = true,
	label = '',
	animated = true,
	className = '',
}) => {
	const percentage = Math.min(Math.max(value, 0), max);
	const percent = (percentage / max) * 100;

	const sizeClasses = {
		sm: 'h-1',
		md: 'h-2',
		lg: 'h-3',
		xl: 'h-4',
	};

	const colorClasses = {
		primary: 'bg-[var(--app-color-primary)]',
		success: 'bg-green-600',
		warning: 'bg-yellow-500',
		danger: 'bg-red-600',
		info: 'bg-blue-600',
	};

	return (
		<div className={className}>
			<div className={`w-full bg-[var(--app-color-surface-elevated)] rounded-full overflow-hidden ${sizeClasses[size] || sizeClasses.md}`}>
				<div
					className={`${colorClasses[color] || colorClasses.primary} ${animated ? 'transition-all duration-300' : ''} h-full rounded-full`}
					style={{ width: `${percent}%` }}
				></div>
			</div>
			{showLabel && <p className='text-sm text-[var(--app-color-text-muted)] mt-2'>{label || `${Math.round(percent)}%`}</p>}
		</div>
	);
};

export default ProgressBar;
