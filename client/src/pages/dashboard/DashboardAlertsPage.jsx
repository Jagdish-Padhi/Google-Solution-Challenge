import { useCallback, useEffect, useState } from 'react';

import { Badge, Button, Card, EmptyState, Loader, Modal, Pagination, Spinner } from '../../components';
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
					<Button variant='secondary' onClick={markAllRead} disabled={alerts.length === 0}>
						Mark all read
					</Button>
				</div>
			</div>

			<section className='grid gap-4 sm:grid-cols-3'>
				<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>Total alerts</p>
					<p className='mt-2 text-3xl font-semibold text-(--app-color-text)'>{alerts.length}</p>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>Unread</p>
					<p className='mt-2 text-3xl font-semibold text-(--app-color-text)'>{alerts.filter((alert) => !alert.read).length}</p>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>High severity</p>
					<p className='mt-2 text-3xl font-semibold text-(--app-color-text)'>
						{alerts.filter((alert) => ['high', 'critical'].includes(alert.severity)).length}
					</p>
				</Card>
			</section>

			<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }} title='Notification feed' subtitle='Read and manage live alerts from the violation engine.'>
				<div className='mb-4 grid gap-3 sm:grid-cols-4'>
					<div>
						<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Severity</label>
						<select
							value={filters.severity}
							onChange={(event) => handleFilterChange('severity', event.target.value)}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						>
							{severityFilters.map((severity) => (
								<option key={severity || 'all'} value={severity}>
									{severity ? severity : 'All severities'}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Type</label>
						<select
							value={filters.type}
							onChange={(event) => handleFilterChange('type', event.target.value)}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						>
							{typeFilters.map((type) => (
								<option key={type || 'all'} value={type}>
									{type ? typeLabel(type) : 'All types'}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Read state</label>
						<select
							value={filters.read}
							onChange={(event) => handleFilterChange('read', event.target.value)}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						>
							<option value=''>All alerts</option>
							<option value='false'>Unread only</option>
							<option value='true'>Read only</option>
						</select>
					</div>
					<div className='flex items-end'>
						<Button
							type='button'
							variant='secondary'
							onClick={() => {
								handleFilterChange('severity', '');
								handleFilterChange('type', '');
								handleFilterChange('read', '');
							}}
						>
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
						{alerts.map((alert) => (
							<button
								key={alert._id}
								type='button'
								onClick={() => openAlert(alert)}
								className={`w-full rounded-2xl border px-4 py-4 text-left transition hover:shadow-sm ${alert.read ? 'border-(--app-color-border) bg-(--app-color-surface)' : 'border-[color-mix(in_srgb,var(--app-color-primary)_28%,var(--app-color-border))] bg-white'}`}
							>
								<div className='flex flex-wrap items-start justify-between gap-3'>
									<div className='space-y-1'>
										<div className='flex flex-wrap items-center gap-2'>
											<Badge variant={severityVariant(alert.severity)} size='sm'>
												{alert.severity}
											</Badge>
											<Badge variant='outline' size='sm'>
												{typeLabel(alert.type)}
											</Badge>
											{!alert.read ? <Badge variant='primary' size='sm'>Unread</Badge> : null}
										</div>
										<p className='text-base font-semibold text-(--app-color-text)'>{alert.title}</p>
										<p className='text-sm text-(--app-color-text-muted)'>{alert.message}</p>
									</div>
									<div className='text-right text-xs text-(--app-color-text-muted)'>
										<p>{new Date(alert.createdAt).toLocaleString()}</p>
										<button
											type='button'
											onClick={(event) => {
											event.stopPropagation();
											markAlertRead(alert._id);
										}}
											className='mt-2 font-semibold uppercase tracking-[0.12em] text-(--app-color-primary) hover:underline'
										>
											Mark read
										</button>
									</div>
								</div>
							</button>
						))}
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
							<Button onClick={() => markAlertRead(selectedAlert._id)} disabled={selectedAlert.read}>
								Mark read
							</Button>
						</div>
					</div>
				) : null}
			</Modal>
		</div>
	);
}