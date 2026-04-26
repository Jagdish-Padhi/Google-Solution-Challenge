/**
 * Card Component
 * Flexible container for content with optional header and footer
 * Lightweight wrapper following theme styling
 */

const Card = ({
	children,
	header = null,
	footer = null,
	title = null,
	subtitle = null,
	elevated = false,
	className = '',
	onClick = null,
	headerAction = null,
	...props
}) => {
	const bgColor = elevated ? 'bg-[var(--app-color-surface-elevated)]' : 'bg-[var(--app-color-surface)]';
	const border = 'border border-[var(--app-color-border)]';
	const clickable = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';

	return (
		<div className={`rounded-xl ${bgColor} ${border} overflow-hidden ${clickable} ${className}`} onClick={onClick} {...props}>
			{/* Header */}
			{(header || title) && (
				<div className='border-b border-(--app-color-border) px-6 py-4'>
					{title ? (
						<div className="flex items-center justify-between">
							<div>
								<h3 className='text-lg font-semibold text-(--app-color-text)'>{title}</h3>
								{subtitle && <p className='text-sm text-(--app-color-text-muted) mt-1'>{subtitle}</p>}
							</div>
							{headerAction && <div>{headerAction}</div>}
						</div>
					) : (
						header
					)}
				</div>
			)}

			{/* Content */}
			<div className='px-6 py-4'>{children}</div>

			{/* Footer */}
			{footer && <div className='border-t border-(--app-color-border) px-6 py-4 bg-(--app-color-surface-elevated)'>{footer}</div>}
		</div>
	);
};

export default Card;
