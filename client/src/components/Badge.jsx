/**
 * Badge Component
 * Small label for status, tags, or categories
 * Multiple color variants for different purposes
 */

const Badge = ({
	children,
	variant = 'default',
	size = 'md',
	icon: Icon = null,
	className = '',
	...props
}) => {
	const baseStyles = 'inline-flex items-center gap-1 font-semibold rounded-full transition-colors';

	const variantStyles = {
		default: 'bg-[var(--app-color-primary-soft)] text-[var(--app-color-primary)]',
		primary: 'bg-[var(--app-color-primary)] text-white',
		secondary: 'bg-[var(--app-color-canvas-glow)] text-[var(--app-color-text)]',
		success: 'bg-[var(--app-color-success)]/10 text-[var(--app-color-success)] border border-[var(--app-color-success)]/20',
		warning: 'bg-[var(--app-color-warning)]/10 text-[var(--app-color-warning)] border border-[var(--app-color-warning)]/20',
		danger: 'bg-[var(--app-color-danger)]/10 text-[var(--app-color-danger)] border border-[var(--app-color-danger)]/20',
		info: 'bg-[var(--app-color-accent)]/10 text-[var(--app-color-accent)] border border-[var(--app-color-accent)]/20',
		outline: 'border border-[var(--app-color-border)] text-[var(--app-color-text)] bg-transparent',
	};

	const sizeStyles = {
		sm: 'px-2 py-1 text-xs',
		md: 'px-3 py-1.5 text-sm',
		lg: 'px-4 py-2 text-base',
	};

	return (
		<span className={`${baseStyles} ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.md} ${className}`} {...props}>
			{Icon && <Icon className='w-4 h-4' />}
			{children}
		</span>
	);
};

export default Badge;
