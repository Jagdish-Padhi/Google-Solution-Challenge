/**
 * Button Component
 * Modular button with multiple variants and states
 * Follows the central theme color palette
 */

const Button = ({
	onClick,
	children,
	variant = 'primary',
	size = 'md',
	disabled = false,
	loading = false,
	type = 'button',
	className = '',
	as: Component = 'button',
	fullWidth = false,
	...props
}) => {
	const baseStyles = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

	const variantStyles = {
		primary:
			'bg-[var(--app-color-primary)] text-white hover:bg-[var(--app-color-primary-hover)] active:scale-95',
		secondary: 'bg-[var(--app-color-surface-elevated)] text-[var(--app-color-text)] border border-[var(--app-color-border)] hover:bg-[var(--app-color-canvas-glow)]',
		tertiary: 'text-[var(--app-color-primary)] hover:bg-[var(--app-color-primary-soft)]',
		danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
		success: 'bg-green-600 text-white hover:bg-green-700 active:scale-95',
		ghost: 'bg-transparent text-(--app-color-text-muted) hover:bg-(--app-color-surface-elevated)',
	};

	const sizeStyles = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg',
		xl: 'px-8 py-4 text-lg',
	};

	const styles = `${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${fullWidth ? 'w-full' : ''} ${className}`;

	return (
		<Component
			type={Component === 'button' ? type : undefined}
			onClick={onClick}
			disabled={disabled || loading}
			className={styles}
			{...props}
		>
			{loading && <span className='inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></span>}
			{children}
		</Component>
	);
};

export default Button;
