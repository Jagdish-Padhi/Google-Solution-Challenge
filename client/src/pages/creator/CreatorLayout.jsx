import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Images, LayoutDashboard, ShieldAlert, Settings, LogOut, User } from 'lucide-react';
import useAuthStore from '../../store/auth.store.js';

const navigationItems = [
	{ label: 'My Portfolio', path: '/creator', icon: LayoutDashboard },
	{ label: 'My Works', path: '/creator/portfolio', icon: Images },
	{ label: 'Theft Findings', path: '/creator/findings', icon: ShieldAlert },
	{ label: 'Account', path: '/creator/account', icon: Settings },
];

export default function CreatorLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const clearAuth = useAuthStore((state) => state.clearAuth);
	const setTransitioning = useAuthStore((state) => state.setTransitioning);
	const isTransitioning = useAuthStore((state) => state.isTransitioning);

	const handleLogout = () => {
		setTransitioning(true, false);
		setTimeout(() => {
			clearAuth();
			navigate('/login');
		}, 300);
	};

	return (
		<div className='flex h-screen overflow-hidden' style={{ background: 'var(--app-color-canvas)' }}>
			{/* Minimal Sidebar */}
			<aside className='flex w-[240px] flex-col overflow-y-auto border-r border-(--app-color-border) bg-white transition-all duration-300 xl:w-[260px]'>
				<div className='flex h-16 shrink-0 items-center gap-3 px-6'>
					<img src='/logo.png' alt='SportShield' className='h-8 w-8 object-contain' />
					<div>
						<h1 className='text-sm font-black uppercase tracking-widest text-(--app-color-text)'>SportShield</h1>
						<p className='text-[9px] font-black uppercase tracking-[0.2em] text-(--app-color-primary)'>Creator</p>
					</div>
				</div>

				<div className='px-6 py-4'>
					<div className='mb-6 rounded-xl bg-slate-50 p-4'>
						<div className='flex items-center gap-1.5 text-slate-400 mb-1'>
							<User size={12} className='text-(--app-color-primary)' />
							<p className='text-[10px] font-black uppercase tracking-widest'>Creator</p>
						</div>
						<p className='truncate text-sm font-bold text-slate-800'>{user?.orgName || 'Independent Creator'}</p>
					</div>

					<nav className='space-y-1.5'>
						{navigationItems.map((item) => {
							const isActive = location.pathname === item.path || (item.path !== '/creator' && location.pathname.startsWith(item.path));
							return (
								<Link
									key={item.path}
									to={item.path}
									className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
										isActive
											? 'bg-(--app-color-primary)/10 text-(--app-color-primary)'
											: 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
									}`}
								>
									<item.icon size={18} className={isActive ? 'text-(--app-color-primary)' : 'text-slate-400 group-hover:text-slate-600'} />
									{item.label}
								</Link>
							);
						})}
					</nav>
				</div>

				<div className='mt-auto p-6'>
					<button
						type='button'
						onClick={handleLogout}
						className='group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600'
					>
						<LogOut size={18} className='text-slate-400 transition-colors group-hover:text-red-500' />
						Sign Out
					</button>
				</div>
			</aside>

			<main className={`flex-1 overflow-y-auto overflow-x-hidden relative transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
				<Outlet />
			</main>
		</div>
	);
}
