import { Link } from 'react-router-dom';

/**
 * Header Component
 * Top navigation bar with logo, nav items, and user menu
 */

const Header = ({
	logo = 'SportShield',
	logoHref = '/',
	navItems = [],
	userMenu = null,
	onLogoClick = null,
	position = 'sticky',
	className = '',
	style,
}) => {
	const positionClass = position === 'fixed' ? 'fixed inset-x-0 top-0' : 'sticky top-0';

	const brand = onLogoClick ? (
		<button
			type='button'
			className='flex items-center gap-2 text-lg font-semibold text-(--app-color-primary)'
			onClick={onLogoClick}
		>
			{logo}
		</button>
	) : (
		<Link to={logoHref} className='flex items-center gap-2 text-lg font-semibold text-(--app-color-primary)'>
			{logo}
		</Link>
	);

	return (
		<header
			className={`${positionClass} z-50 border-b border-(--app-color-border) shadow-[0_10px_30px_rgba(11,20,34,0.04)] ${className}`}
			style={{
				backdropFilter: 'blur(18px)',
				backgroundColor: 'rgba(247, 250, 252, 0.84)',
				...style,
			}}
		>
			<div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
				{brand}

				<nav className='hidden items-center gap-6 md:flex'>
					{navItems.map((item) => (
						<a
							key={item.label}
							href={item.href}
							className='text-sm font-medium text-(--app-color-text-muted) transition-colors hover:text-(--app-color-primary)'
						>
							{item.label}
						</a>
					))}
				</nav>

				<div className='flex items-center gap-3'>{userMenu}</div>
			</div>
		</header>
	);
};

export default Header;
