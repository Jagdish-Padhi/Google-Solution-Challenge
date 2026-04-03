import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import Badge from '../Badge';
import Button from '../Button';
import Container from '../Container';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';

const navigationItems = [
	{ label: 'Overview', path: '/dashboard' },
	{ label: 'Assets', path: '/dashboard/assets' },
];

const shellBackground = {
	background: 'var(--app-gradient-shell)',
};

export default function DashboardLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const clearAuth = useAuthStore((state) => state.clearAuth);

	const handleLogout = async () => {
		try {
			await api.post('/auth/logout');
		} finally {
			clearAuth();
			navigate('/login');
		}
	};

	return (
		<div className='min-h-screen text-(--app-color-text)' style={shellBackground}>
			<header className='sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-xl'>
				<Container className='flex min-h-20 items-center justify-between gap-4 py-4'>
					<Link to='/dashboard' className='flex items-center gap-3'>
						<span className='grid h-11 w-11 place-items-center rounded-2xl bg-(--app-color-primary) text-lg font-bold text-white shadow-lg shadow-teal-500/20'>
							S
						</span>
						<div>
							<p className='text-xs font-semibold uppercase tracking-[0.28em] text-(--app-color-text-muted)'>SportShield</p>
							<h1 className='text-lg font-semibold'>Dashboard</h1>
						</div>
					</Link>

					<nav className='hidden items-center gap-2 md:flex'>
						{navigationItems.map((item) => {
							const isActive = location.pathname === item.path;

							return (
								<Link
									key={item.path}
									to={item.path}
									className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-(--app-color-primary-soft) text-(--app-color-primary)' : 'text-(--app-color-text-muted) hover:text-(--app-color-text)'}`}
								>
									{item.label}
								</Link>
							);
						})}
					</nav>

					<div className='flex items-center gap-3'>
						<Badge variant='outline' className='hidden sm:inline-flex'>
							{user?.orgName || 'Guest'}
						</Badge>
						<Button variant='secondary' size='sm' onClick={handleLogout}>
							Logout
						</Button>
					</div>
				</Container>
			</header>

			<main className='py-8'>
				<Container>
					<Outlet />
				</Container>
			</main>
		</div>
	);
}