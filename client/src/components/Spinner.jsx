/**
 * Spinner Component
 * Loading indicator with multiple sizes and variants
 */

const Spinner = ({
	size = 'md',
	variant = 'primary',
	label = '',
	fullScreen = false,
	className = '',
}) => {
	const sizeStyles = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12',
		xl: 'w-16 h-16',
	};

	const variantStyles = {
		primary: 'border-[var(--app-color-primary)]',
		secondary: 'border-[var(--app-color-accent)]',
		white: 'border-white',
	};

	const spinnerClasses = `${sizeStyles[size] || sizeStyles.md} border-4 border-transparent rounded-full animate-spin`;

	const container = fullScreen ? (
		<div className='fixed inset-0 flex items-center justify-center bg-black/50 z-50'>
			<div className='text-center'>
				<div className={`${spinnerClasses} ${variantStyles[variant] || variantStyles.primary} ${className}`}></div>
				{label && <p className='text-white mt-4 text-sm'>{label}</p>}
			</div>
		</div>
	) : (
		<div className='flex flex-col items-center gap-2'>
			<div className={`${spinnerClasses} ${variantStyles[variant] || variantStyles.primary} ${className}`}></div>
			{label && <p className='text-[var(--app-color-text-muted)] text-sm'>{label}</p>}
		</div>
	);

	return container;
};

export default Spinner;
