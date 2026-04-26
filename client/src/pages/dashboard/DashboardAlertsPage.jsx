import { useCallback, useEffect, useState } from 'react';

import { 
	Bell, 
	BellRing, 
	Check,
	CheckCheck,
	CheckCircle2, 
	Clock, 
	Filter, 
	Info, 
	MailOpen, 
	Shield, 
	ShieldAlert, 
	Zap 
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, Loader, Modal, Pagination, Select, Spinner } from '../../components';
import api from '../../services/api.js';

const severityFilters = ['', 'low', 'medium', 'high', 'critical'];
const typeFilters = ['', 'new_violation', 'high_confidence', 'platform_surge'];

function severityVariant(severity) {
	if (severity === 'critical' || severity === 'high') {
		return 'danger';
	}

	if (severity === 'medium') {
		return 'warning';
	}

	if (severity === 'low') {
		return 'info';
	}

	return 'secondary';
}

function typeLabel(type) {
	return type.replace('_', ' ');
}

export default function DashboardAlertsPage() {
	const [alerts, setAlerts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [selectedAlert, setSelectedAlert] = useState(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [filters, setFilters] = useState({
		severity: '',
		type: '',
		read: '',
	});
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10,
		totalPages: 1,
	});

	const loadAlerts = useCallback(async () => {
		try {
			const response = await api.get('/alerts', {
				params: {
					page: pagination.page,
					limit: pagination.limit,
					severity: filters.severity || undefined,
					type: filters.type || undefined,
					read: filters.read === '' ? undefined : filters.read,
				},
			});

			setAlerts(response.data.items || []);
			setPagination((current) => ({
				...current,
				totalPages: response.data.totalPages || 1,
			}));
			setError('');
		} catch {
			setError('Unable to load alerts right now.');
		} finally {
			setIsLoading(false);
		}
	}, [filters.read, filters.severity, filters.type, pagination.limit, pagination.page]);

	useEffect(() => {
		loadAlerts();
	}, [loadAlerts]);

	useEffect(() => {
		const handleAlertsChanged = () => {
			loadAlerts();
		};

		window.addEventListener('sportshield:alerts:new', handleAlertsChanged);
		window.addEventListener('sportshield:alerts:updated', handleAlertsChanged);

		return () => {
			window.removeEventListener('sportshield:alerts:new', handleAlertsChanged);
			window.removeEventListener('sportshield:alerts:updated', handleAlertsChanged);
		};
	}, [loadAlerts]);

	const handleFilterChange = (name, value) => {
		setFilters((current) => ({
			...current,
			[name]: value,
		}));
		setPagination((current) => ({
			...current,
			page: 1,
		}));
	};

	const openAlert = (alert) => {
		setSelectedAlert(alert);
		setIsDetailsOpen(true);
	};

	const markAlertRead = async (alertId) => {
		try {
			await api.patch('/alerts/read', { alertIds: [alertId] });
			await loadAlerts();
		} catch {
			setError('Unable to update alert state.');
		}
	};

	const markAllRead = async () => {
		try {
			await api.patch('/alerts/read-all');
			await loadAlerts();
		} catch {
			setError('Unable to mark alerts as read.');
		}
	};

	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<h2 className='text-2xl font-semibold text-(--app-color-text)'>Alerts</h2>
					<p className='text-sm text-(--app-color-text-muted)'>Track fresh violations and alert status across the organization.</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button variant='secondary' onClick={markAllRead} disabled={alerts.length === 0} className="flex items-center gap-2">
						<CheckCircle2 size={16} />
						Mark all read
					</Button>
				</div>
			</div>

			<section className='grid gap-6 sm:grid-cols-3'>
				<Card className='border-(--app-color-border) shadow-sm group hover:border-(--app-color-primary)/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Total alerts</p>
							<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{alerts.length}</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) group-hover:scale-110 transition-transform">
							<Bell size={22} />
						</div>
					</div>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm group hover:border-(--app-color-primary)/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Unread</p>
							<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{alerts.filter((alert) => !alert.read).length}</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) group-hover:scale-110 transition-transform">
							<MailOpen size={22} />
						</div>
					</div>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm group hover:border-red-500/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>High severity</p>
							<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>
								{alerts.filter((alert) => ['high', 'critical'].includes(alert.severity)).length}
							</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
							<ShieldAlert size={22} />
						</div>
					</div>
				</Card>
			</section>

			<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }} title='Notification feed' subtitle='Read and manage live alerts from the violation engine.'>
				<div className='mb-6 grid gap-6 sm:grid-cols-4 items-end'>
					<Select
						label='Severity'
						value={filters.severity}
						onChange={(event) => handleFilterChange('severity', event.target.value)}
						options={severityFilters.map(s => ({
							label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All severities',
							value: s
						}))}
					/>
					<Select
						label='Type'
						value={filters.type}
						onChange={(event) => handleFilterChange('type', event.target.value)}
						options={typeFilters.map(t => ({
							label: t ? typeLabel(t).charAt(0).toUpperCase() + typeLabel(t).slice(1) : 'All types',
							value: t
						}))}
					/>
					<Select
						label='Read state'
						value={filters.read}
						onChange={(event) => handleFilterChange('read', event.target.value)}
						options={[
							{ label: 'All alerts', value: '' },
							{ label: 'Unread only', value: 'false' },
							{ label: 'Read only', value: 'true' },
						]}
					/>
					<div className='pb-0.5'>
						<Button
							type='button'
							variant='secondary'
							fullWidth
							className="h-[42px] flex items-center justify-center gap-2"
							onClick={() => {
								handleFilterChange('severity', '');
								handleFilterChange('type', '');
								handleFilterChange('read', '');
							}}
						>
							<Filter size={14} />
							Clear filters
						</Button>
					</div>
				</div>

				{error ? (
					<p className='text-sm text-red-600'>{error}</p>
				) : isLoading ? (
					<div className='flex flex-col items-center justify-center py-12 gap-6 text-sm text-(--app-color-text-muted)'>
						<Loader size={0.6} />
						<p className="font-bold uppercase tracking-widest animate-pulse">Checking organization alerts...</p>
					</div>
				) : alerts.length === 0 ? (
					<EmptyState title='No alerts yet' message='The alert engine will populate this feed when violations are detected.' />
				) : (
					<div className='space-y-3'>
						{alerts.map((alert) => {
							const isHigh = ['high', 'critical'].includes(alert.severity);
							return (
								<button
									key={alert._id}
									type='button'
									onClick={() => openAlert(alert)}
									className={`w-full rounded-2xl border px-4 py-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group/alert ${alert.read ? 'border-(--app-color-border) bg-(--app-color-surface)' : 'border-[color-mix(in_srgb,var(--app-color-primary)_35%,var(--app-color-border))] bg-white ring-1 ring-(--app-color-primary)/5'}`}
								>
									<div className='flex flex-wrap items-start justify-between gap-4'>
										<div className='flex items-start gap-4 flex-1'>
											<div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isHigh ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
												{isHigh ? <ShieldAlert size={20} /> : <Info size={20} />}
											</div>
											<div className='space-y-1 flex-1'>
												<div className='flex flex-wrap items-center gap-2'>
													<Badge variant={severityVariant(alert.severity)} size='sm' className="font-bold uppercase tracking-wider">
														{alert.severity}
													</Badge>
													<Badge variant='outline' size='sm' className="font-bold uppercase tracking-wider">
														{typeLabel(alert.type)}
													</Badge>
													{!alert.read ? <Badge variant='primary' size='sm' className="font-bold tracking-wider">NEW</Badge> : null}
												</div>
												<p className='text-base font-bold text-(--app-color-text)'>{alert.title}</p>
												<p className='text-sm text-(--app-color-text-muted) line-clamp-1'>{alert.message}</p>
											</div>
										</div>
										<div className='text-right space-y-3'>
											<p className="flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-wider text-(--app-color-text-muted)">
												<Clock size={12} />
												{new Date(alert.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
											</p>
											{alert.read ? (
												<div className='flex items-center justify-end gap-1 ml-auto text-[10px] font-black uppercase tracking-widest text-emerald-600'>
													<CheckCheck size={14} strokeWidth={3} />
													Read
												</div>
											) : (
												<button
													type='button'
													onClick={(event) => {
														event.stopPropagation();
														markAlertRead(alert._id);
													}}
													className='flex items-center justify-end gap-1.5 ml-auto text-xs font-bold uppercase tracking-[0.1em] text-(--app-color-primary) hover:bg-(--app-color-primary-soft) px-2 py-1 rounded-lg transition-all'
												>
													<Check size={14} />
													Mark read
												</button>
											)}
										</div>
									</div>
								</button>
							);
						})}
					</div>
				)}

				{pagination.totalPages > 1 ? (
					<Pagination
						currentPage={pagination.page}
						totalPages={pagination.totalPages}
						hasPreviousPage={pagination.page > 1}
						hasNextPage={pagination.page < pagination.totalPages}
						onPageChange={(nextPage) => {
							setPagination((current) => ({
								...current,
								page: Math.min(Math.max(1, nextPage), Math.max(1, current.totalPages)),
							}));
						}}
						className='mt-4'
					/>
				) : null}
			</Card>

			<Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title='Alert details' size='lg'>
				{selectedAlert ? (
					<div className='space-y-4 text-sm'>
						<div className='flex flex-wrap items-center gap-2'>
							<Badge variant={severityVariant(selectedAlert.severity)}>{selectedAlert.severity}</Badge>
							<Badge variant='outline'>{typeLabel(selectedAlert.type)}</Badge>
							<Badge variant={selectedAlert.read ? 'secondary' : 'primary'}>{selectedAlert.read ? 'Read' : 'Unread'}</Badge>
						</div>

						<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
							<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Title</p>
							<p className='mt-1 text-base font-semibold text-(--app-color-text)'>{selectedAlert.title}</p>
						</div>

						<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
							<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Message</p>
							<p className='mt-1 text-(--app-color-text)'>{selectedAlert.message}</p>
						</div>

						<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
							<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Channels</p>
							<p className='mt-1 text-(--app-color-text)'>{(selectedAlert.channels || []).join(', ') || 'in-app'}</p>
						</div>

						<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
							<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Created</p>
							<p className='mt-1 text-(--app-color-text)'>{new Date(selectedAlert.createdAt).toLocaleString()}</p>
						</div>

						<div className='flex justify-end'>
							{selectedAlert.read ? (
								<div className='flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 px-4 py-2'>
									<CheckCheck size={16} strokeWidth={3} />
									Read
								</div>
							) : (
								<Button onClick={() => markAlertRead(selectedAlert._id)}>
									Mark read
								</Button>
							)}
						</div>
					</div>
				) : null}
			</Modal>
		</div>
	);
}