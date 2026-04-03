/**
 * ListItem Component
 * Reusable list item with icon, title, description, and actions
 */

const ListItem = ({
	icon: Icon = null,
	title,
	description = '',
	value = null,
	action = null,
	onClick = null,
	divider = true,
	className = '',
}) => {
	return (
		<div
			className={`flex items-center gap-4 px-6 py-4 ${divider ? 'border-b border-[var(--app-color-border)]' : ''} ${
				onClick ? 'cursor-pointer hover:bg-[var(--app-color-surface-elevated)] transition-colors' : ''
			} ${className}`}
			onClick={onClick}
		>
			{Icon && <div className='flex-shrink-0'>{Icon}</div>}
			<div className='flex-1 min-w-0'>
				<h4 className='text-sm font-semibold text-[var(--app-color-text)] truncate'>{title}</h4>
				{description && <p className='text-xs text-[var(--app-color-text-muted)] mt-1 truncate'>{description}</p>}
			</div>
			{value && <div className='flex-shrink-0 text-sm font-medium text-[var(--app-color-text-muted)]'>{value}</div>}
			{action && <div className='flex-shrink-0'>{action}</div>}
		</div>
	);
};

export default ListItem;
