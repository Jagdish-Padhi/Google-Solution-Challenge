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
			className='flex items-center gap-3 logo-brand group'
			onClick={onLogoClick}
		>
			<img src='/navlogo.png' alt='SportShield' className='h-12 w-12 object-contain transition-transform duration-500 group-hover:scale-110' />
			<div className="flex items-baseline gap-0.5">
				<span className="text-(--app-color-text) text-2xl!">Sport</span>
				<span className="logo-shield text-2xl!">Shield</span>
			</div>
		</button>
	) : (
		<Link to={logoHref} className='flex items-center gap-3 logo-brand group'>
			<img src='/navlogo.png' alt='SportShield' className='h-12 w-12 object-contain transition-transform duration-500 group-hover:scale-110' />
			<div className="flex items-baseline gap-0.5">
				<span className="text-(--app-color-text) text-2xl!">Sport</span>
				<span className="logo-shield text-2xl!">Shield</span>
			</div>
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
					{navItems.map((item) => {
						const Icon = item.icon;
						return (
							<a
								key={item.label}
								href={item.href}
								className='nav-link-underline flex items-center gap-2 text-sm font-medium'
							>
								{Icon && <Icon size={16} className="text-(--app-color-success)/70" />}
								{item.label}
							</a>
						);
					})}
				</nav>

				<div className='flex items-center gap-3'>{userMenu}</div>
			</div>
		</header>
	);
};

export default Header;
