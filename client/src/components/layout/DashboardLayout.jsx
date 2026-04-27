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
	ShieldAlert,
} from 'lucide-react';

const navigationItems = [
	{ label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
	{ label: 'Assets', path: '/dashboard/assets', icon: Layers },
	{ label: 'Scans', path: '/dashboard/scans', icon: Radar },
	{ label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
	{ label: 'Alerts', path: '/dashboard/alerts', icon: Bell },
	{ label: 'Violations', path: '/dashboard/violations', icon: ShieldAlert },
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

			socket?.on('alerts:unread-count', updateUnreadCount);
			socket?.on('alerts:new', handleAlertCreated);
			socket?.on('alerts:updated', handleAlertsUpdated);
		}

		return () => {
			mounted = false;
			clearInterval(timer);
			if (socket) {
				socket.off('alerts:unread-count');
				socket.off('alerts:new');
				socket.off('alerts:updated');
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
				<Container className='flex min-h-20 items-center justify-between gap-4 py-4'>
					<Link to='/' className='flex items-center gap-3 group'>
						<img src='/navlogo.png' alt='SportShield' className='h-12 w-12 object-contain transition-transform duration-500 group-hover:scale-110' />
						<div className="logo-brand">
							<div className="flex items-baseline gap-0.5">
								<span className="text-(--app-color-text) text-2xl!">Sport</span>
								<span className="logo-shield text-2xl!">Shield</span>
							</div>
						</div>
					</Link>

					<nav className='hidden items-center gap-2 md:flex'>
						{navigationItems.map((item) => {
							const isActive = location.pathname === item.path;
							const Icon = item.icon;

							return (
								<Link
									key={item.path}
									to={item.path}
									className={`nav-link-underline px-4 py-2 text-sm font-medium ${isActive ? 'active' : ''}`}
								>
									<span className='flex items-center gap-2.5'>
										<Icon size={16} className={`${isActive ? 'text-(--app-color-success)' : 'text-(--app-color-text-muted)'} transition-colors duration-300`} />
										{item.label}
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

					<div className='flex items-center gap-3'>
						<div className='tooltip-container'>
							<div className='flex h-11 w-11 items-center justify-center rounded-full border border-(--app-color-border) bg-white/50 text-(--app-color-primary) transition-all hover:bg-white hover:border-(--app-color-primary)/30 hover:shadow-md cursor-help'>
								<Building2 size={20} />
							</div>
							<div className='tooltip-dropdown-content'>
								{user?.orgName || 'Guest'}
							</div>
						</div>

						<button 
							onClick={handleLogout}
							className='tooltip-container group'
						>
							<div className='flex h-11 w-11 items-center justify-center rounded-full border border-red-100 bg-red-50/50 text-red-500 transition-all hover:bg-red-50 hover:border-red-200 hover:shadow-md'>
								<LogOut size={20} />
							</div>
							<div className='tooltip-dropdown-content !text-red-600 !border-red-100'>
								Logout
							</div>
						</button>
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
