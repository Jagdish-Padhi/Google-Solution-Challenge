/**
 * EmptyState Component
 * Display when no data is available with helpful message
 */

const EmptyState = ({
	icon: Icon = null,
	title = 'No data available',
	message = 'There is nothing to display here.',
	action = null,
	className = '',
}) => {
	return (
		<div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
			{Icon && (
				<div className='mb-4 rounded-full bg-[var(--app-color-primary-soft)] p-4'>
					<Icon className='w-8 h-8 text-[var(--app-color-primary)]' />
				</div>
			)}
			<h3 className='text-lg font-semibold text-[var(--app-color-text)] mb-2'>{title}</h3>
			<p className='text-[var(--app-color-text-muted)] mb-6 max-w-sm'>{message}</p>
			{action && <div>{action}</div>}
		</div>
	);
};

export default EmptyState;
