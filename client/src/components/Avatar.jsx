/**
 * Avatar Component
 * Display user avatars with initials or image
 */

const Avatar = ({
	src = null,
	initials = '',
	alt = 'Avatar',
	size = 'md',
	className = '',
	onClick = null,
}) => {
	const sizeClasses = {
		xs: 'w-6 h-6 text-xs',
		sm: 'w-8 h-8 text-sm',
		md: 'w-10 h-10 text-base',
		lg: 'w-12 h-12 text-lg',
		xl: 'w-16 h-16 text-xl',
	};

	const baseStyles = `inline-flex items-center justify-center rounded-full font-semibold transition-transform ${
		onClick ? 'cursor-pointer hover:scale-110' : ''
	} ${className}`;

	return src ? (
		<img src={src} alt={alt} className={`${baseStyles} ${sizeClasses[size] || sizeClasses.md} object-cover`} onClick={onClick} />
	) : (
		<div className={`${baseStyles} ${sizeClasses[size] || sizeClasses.md} bg-[var(--app-color-primary-soft)] text-[var(--app-color-primary)]`} onClick={onClick}>
			{initials}
		</div>
	);
};

export default Avatar;
