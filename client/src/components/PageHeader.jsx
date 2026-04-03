/**
 * PageHeader Component
 * Standard page header with title, subtitle, and actions
 */

const PageHeader = ({
	title,
	subtitle = '',
	action = null,
	breadcrumbs = null,
	className = '',
}) => {
	return (
		<div className={`mb-8 ${className}`}>
			{breadcrumbs && (
				<nav className='flex items-center gap-2 text-sm mb-4 text-[var(--app-color-text-muted)]'>
					{breadcrumbs.map((crumb, index) => (
						<div key={index} className='flex items-center gap-2'>
							{index > 0 && <span>/</span>}
							{crumb.href ? (
								<a href={crumb.href} className='hover:text-[var(--app-color-primary)] transition-colors'>
									{crumb.label}
								</a>
							) : (
								<span>{crumb.label}</span>
							)}
						</div>
					))}
				</nav>
			)}
			<div className='flex items-start justify-between gap-4'>
				<div className='flex-1'>
					<h1 className='text-3xl font-bold text-[var(--app-color-text)]'>{title}</h1>
					{subtitle && <p className='text-[var(--app-color-text-muted)] mt-2'>{subtitle}</p>}
				</div>
				{action && <div className='flex-shrink-0'>{action}</div>}
			</div>
		</div>
	);
};

export default PageHeader;
