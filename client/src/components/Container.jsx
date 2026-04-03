/**
 * Container Component
 * Layout wrapper with proper padding and max-width
 */

const Container = ({
	children,
	size = 'lg',
	className = '',
	...props
}) => {
	const maxWidthClasses = {
		sm: 'max-w-2xl',
		md: 'max-w-4xl',
		lg: 'max-w-6xl',
		xl: 'max-w-7xl',
		full: 'max-w-full',
	};

	return (
		<div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[size] || maxWidthClasses.lg} ${className}`} {...props}>
			{children}
		</div>
	);
};

export default Container;
