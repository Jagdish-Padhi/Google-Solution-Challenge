/**
 * Breadcrumb Component
 * Navigation breadcrumb trail
 */

const Breadcrumb = ({
	items = [],
	separator = '/',
	className = '',
}) => {
	if (!items || items.length === 0) return null;

	return (
		<nav className={`flex items-center gap-2 text-sm ${className}`} aria-label='Breadcrumb'>
			{items.map((item, index) => (
				<div key={index} className='flex items-center gap-2'>
					{index > 0 && <span className='text-[var(--app-color-text-muted)]'>{separator}</span>}
					{item.href ? (
						<a href={item.href} className='text-[var(--app-color-primary)] hover:underline transition-colors'>
							{item.label}
						</a>
					) : (
						<span className='text-[var(--app-color-text)]'>{item.label}</span>
					)}
				</div>
			))}
		</nav>
	);
};

export default Breadcrumb;
