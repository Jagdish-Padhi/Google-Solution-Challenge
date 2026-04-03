/**
 * Header Component
 * Top navigation bar with logo, nav items, and user menu
 */

const Header = ({
	logo = 'SportShield',
	navItems = [],
	userMenu = null,
	onLogoClick = null,
	className = '',
}) => {
	return (
		<header className={`bg-[var(--app-color-surface)] border-b border-[var(--app-color-border)] sticky top-0 z-40 ${className}`}>
			<div className='flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'>
				{/* Logo */}
				<div
					className={`flex items-center gap-2 text-lg font-bold text-[var(--app-color-primary)] ${onLogoClick ? 'cursor-pointer' : ''}`}
					onClick={onLogoClick}
				>
					{logo}
				</div>

				{/* Nav Items */}
				<nav className='hidden md:flex items-center gap-6'>
					{navItems.map((item) => (
						<a
							key={item.label}
							href={item.href}
							className='text-sm font-medium text-[var(--app-color-text)] hover:text-[var(--app-color-primary)] transition-colors'
						>
							{item.label}
						</a>
					))}
				</nav>

				{/* User Menu / Actions */}
				<div className='flex items-center gap-4'>{userMenu}</div>
			</div>
		</header>
	);
};

export default Header;
