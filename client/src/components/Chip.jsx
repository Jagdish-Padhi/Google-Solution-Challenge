/**
 * Chip/Tag Component
 * Small removable badges/chips
 */

const Chip = ({
	label,
	onRemove = null,
	variant = 'default',
	size = 'md',
	className = '',
	...props
}) => {
	const variantStyles = {
		default: 'bg-[var(--app-color-primary-soft)] text-[var(--app-color-primary)]',
		primary: 'bg-[var(--app-color-primary)] text-white',
		secondary: 'bg-[var(--app-color-canvas-glow)] text-[var(--app-color-text)]',
		outline: 'border border-[var(--app-color-border)] text-[var(--app-color-text)] bg-transparent',
	};

	const sizeStyles = {
		sm: 'px-2 py-1 text-xs',
		md: 'px-3 py-1.5 text-sm',
		lg: 'px-4 py-2 text-base',
	};

	return (
		<div
			className={`inline-flex items-center gap-2 rounded-full font-medium transition-all ${
				variantStyles[variant] || variantStyles.default
			} ${sizeStyles[size] || sizeStyles.md} ${className}`}
			{...props}
		>
			<span>{label}</span>
			{onRemove && (
				<button
					onClick={onRemove}
					className='flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity'
					aria-label='Remove'
				>
					<svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
						<path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd' />
					</svg>
				</button>
			)}
		</div>
	);
};

export default Chip;
