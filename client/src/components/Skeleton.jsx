/**
 * Skeleton Component
 * Loading skeleton for placeholder while content loads
 */

const Skeleton = ({
	variant = 'text',
	width = '100%',
	height = '1rem',
	count = 1,
	circle = false,
	className = '',
	...props
}) => {
	const variants = {
		text: 'rounded',
		circle: 'rounded-full',
		rectangular: 'rounded-lg',
	};

	const variantClass = circle ? variants.circle : variants[variant] || variants.text;

	return (
		<div className={className}>
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className={`${variantClass} bg-gradient-to-r from-[var(--app-color-border)] via-[var(--app-color-surface-elevated)] to-[var(--app-color-border)] animate-pulse mb-2`}
					style={{ width, height }}
					{...props}
				/>
			))}
		</div>
	);
};

export default Skeleton;
