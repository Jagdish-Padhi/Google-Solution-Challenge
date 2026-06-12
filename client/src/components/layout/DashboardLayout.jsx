import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import Badge from '../Badge';
import Button from '../Button';
import Container from '../Container';
import api from '../../services/api.js';
import { connectRealtime, disconnectRealtime } from '../../services/realtime.js';
import useAuthStore from '../../store/auth.store.js';
import useReportStore from '../../store/report.store.js';
import ReportGenerationModal from '../ReportGenerationModal';

import {
	BarChart3,
	Bell,
	Building2,
	Layers,
	LayoutDashboard,
	LogOut,
	Radar,
	Settings,
	ShieldAlert,
	Tv,
} from 'lucide-react';

const navigationItems = [
	{ label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
	{ label: 'Assets', path: '/dashboard/assets', icon: Layers },
	{ label: 'Streams', path: '/dashboard/streams', icon: Tv },
	{ label: 'Scans', path: '/dashboard/scans', icon: Radar },
	{ label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
	{ label: 'Alerts', path: '/dashboard/alerts', icon: Bell },
	{ label: 'Violations', path: '/dashboard/violations', icon: ShieldAlert },
	{ label: 'Settings', path: '/dashboard/settings', icon: Settings },
];

const shellBackground = {
	background: 'var(--app-gradient-shell)',
};

export default function DashboardLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const accessToken = useAuthStore((state) => state.accessToken);
	const clearAuth = useAuthStore((state) => state.clearAuth);
	const setTransitioning = useAuthStore((state) => state.setTransitioning);
	const isTransitioning = useAuthStore((state) => state.isTransitioning);
	const [unreadAlerts, setUnreadAlerts] = useState(0);
	const [isProfileOpen, setIsProfileOpen] = useState(false);

	useEffect(() => {
		let mounted = true;
		let socket;

		async function loadUnreadAlerts() {
			try {
				const response = await api.get('/alerts/unread-count');
				if (mounted) {
					setUnreadAlerts(Number(response.data?.unreadCount || 0));
				}
			} catch {
				if (mounted) {
					setUnreadAlerts(0);
				}
			}
		}

		loadUnreadAlerts();
		const timer = setInterval(loadUnreadAlerts, 30000);

		if (accessToken) {
			socket = connectRealtime(accessToken);

			const updateUnreadCount = (payload) => {
				if (mounted) {
					setUnreadAlerts(Number(payload?.unreadCount || 0));
				}
			};

			const handleAlertCreated = (payload) => {
				updateUnreadCount(payload);
				window.dispatchEvent(new CustomEvent('sportshield:alerts:new', { detail: payload }));
			};

			const handleAlertsUpdated = (payload) => {
				updateUnreadCount(payload);
				window.dispatchEvent(new CustomEvent('sportshield:alerts:updated', { detail: payload }));
			};

			const handleLivestreamTelemetry = (payload) => {
				window.dispatchEvent(new CustomEvent('sportshield:livestream:telemetry', { detail: payload }));
			};

			socket?.on('alerts:unread-count', updateUnreadCount);
			socket?.on('alerts:new', handleAlertCreated);
			socket?.on('alerts:updated', handleAlertsUpdated);
			socket?.on('livestream:telemetry', handleLivestreamTelemetry);
		}

		return () => {
			mounted = false;
			clearInterval(timer);
			if (socket) {
				socket.off('alerts:unread-count');
				socket.off('alerts:new');
				socket.off('alerts:updated');
				socket.off('livestream:telemetry');
				disconnectRealtime();
			}
		};
	}, [accessToken]);

	const handleLogout = async () => {
		setTransitioning(true);
		try {
			await api.post('/auth/logout');
		} finally {
			clearAuth();
			navigate('/login');
		}
	};

	const { isGenerating, progress, generatedReport, dismissModal, hideGenerating } = useReportStore();

	const handleDownloadReport = async (report) => {
		if (!report.fileUrl) return toast.error('Download link not available.');
		
		try {
			// Resolve absolute URL
			let downloadUrl = report.fileUrl;
			if (!/^https?:\/\//i.test(downloadUrl)) {
				const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
				const apiOrigin = new URL(apiBaseUrl).origin;
				downloadUrl = `${apiOrigin}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
			}

			const response = await api.get(downloadUrl, {
				responseType: 'blob',
			});

			const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
			const anchor = document.createElement('a');
			anchor.href = blobUrl;
			anchor.download = `SportShield_Report_${report._id || 'Generated'}.pdf`;
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			window.URL.revokeObjectURL(blobUrl);
		} catch (error) {
			console.error('Download error:', error);
			// Fallback
			window.open(report.fileUrl, '_blank');
		}
	};

	return (
		<div className={`min-h-screen text-(--app-color-text) ${isTransitioning ? 'animate-dashboard-exit' : 'animate-dashboard-land'}`} style={shellBackground}>
			{(isGenerating || generatedReport) && (
				<ReportGenerationModal
					isGenerating={isGenerating}
					progress={progress}
					report={generatedReport}
					onClose={dismissModal}
					onBackground={hideGenerating}
					onDownload={handleDownloadReport}
				/>
			)}
			<header className='sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-xl'>
				<Container size='xl' className='flex min-h-20 items-center justify-between gap-4 py-4'>
					<Link to='/' className='flex items-center gap-3 group shrink-0'>
						<img src='/navlogo.png' alt='SportShield' className='h-12 w-12 object-contain transition-transform duration-500 group-hover:scale-110' />
						<div className="logo-brand">
							<div className="flex items-baseline gap-0.5">
								<span className="text-(--app-color-text) text-2xl!">Sport</span>
								<span className="logo-shield text-2xl!">Shield</span>
							</div>
						</div>
					</Link>

					<nav className='hidden items-center gap-1 lg:gap-2 md:flex'>
						{navigationItems.filter(item => {
							if (user?.role === 'legal') {
								// Legal role only sees dashboard, violations, and alerts
								return ['/dashboard', '/dashboard/violations', '/dashboard/alerts'].includes(item.path);
							}
							if (user?.role === 'analyst') {
								// Analyst cannot see settings
								return item.path !== '/dashboard/settings';
							}
							return true; // Admin sees all
						}).map((item) => {
							const isActive = location.pathname === item.path;
							const Icon = item.icon;

							return (
								<Link
									key={item.path}
									to={item.path}
									className={`nav-link-underline px-2 lg:px-3 xl:px-4 py-2 text-sm font-medium ${isActive ? 'active' : ''}`}
								>
									<span className='flex items-center gap-2'>
										<Icon size={16} className={`${isActive ? 'text-(--app-color-success)' : 'text-(--app-color-text-muted)'} transition-colors duration-300`} />
										<span className='hidden lg:inline'>{item.label}</span>
										{item.label === 'Alerts' && unreadAlerts > 0 ? (
											<Badge variant='danger' size='sm' className='min-w-6 justify-center px-2 py-0.5 text-[10px]'>
												{unreadAlerts > 99 ? '99+' : unreadAlerts}
											</Badge>
										) : null}
									</span>
								</Link>
							);
						})}
					</nav>

					<div className='flex items-center gap-3 shrink-0'>
						<div className='relative'>
							<button 
								onClick={() => setIsProfileOpen(!isProfileOpen)}
								className='flex h-11 items-center gap-2 rounded-full border border-(--app-color-border) bg-white/50 pl-2 pr-4 text-(--app-color-text) transition-all hover:bg-white hover:border-(--app-color-primary)/30 hover:shadow-md'
							>
								<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--app-color-primary)] text-white text-xs font-bold uppercase shadow-inner">
									{user?.role?.charAt(0) || 'A'}
								</div>
								<span className="text-sm font-semibold capitalize hidden sm:block text-slate-700">
									{user?.role || 'Admin'}
								</span>
							</button>
							
							{isProfileOpen && (
								<>
									<div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
									<div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--app-color-border)] bg-white p-2 shadow-2xl z-50">
										<div className="px-3 py-3 border-b border-[var(--app-color-border)]/50 mb-2 flex items-center gap-3">
											<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500'>
												<Building2 size={18} />
											</div>
											<div className="min-w-0">
												<p className="text-[10px] font-bold text-[var(--app-color-text-muted)] uppercase tracking-widest leading-none mb-1">Organization</p>
												<p className="text-sm font-bold text-slate-900 truncate leading-tight">{user?.orgName || 'Guest'}</p>
											</div>
										</div>
										
										<div className="px-2 py-1.5">
											<div className="flex items-center justify-between px-2 py-1">
												<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</span>
												<span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-widest">{user?.role || 'Admin'}</span>
											</div>
										</div>

										<div className="mt-2 border-t border-[var(--app-color-border)]/50 pt-2 px-2 pb-1">
											<button
												onClick={handleLogout}
												className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
											>
												<LogOut size={16} />
												Sign Out
											</button>
										</div>
									</div>
								</>
							)}
						</div>
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
