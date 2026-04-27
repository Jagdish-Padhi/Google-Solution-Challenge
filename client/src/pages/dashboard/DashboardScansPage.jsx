import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { 
	Activity, 
	AlertCircle, 
	CalendarClock, 
	CheckCircle2, 
	Clock, 
	Eye, 
	Globe, 
	Layers, 
	Play, 
	Plus, 
	RotateCcw, 
	Search, 
	Sparkles,
	Target
} from 'lucide-react';

import { Badge, Button, Card, EmptyState, Loader, Modal, Pagination, Select, Spinner } from '../../components';
import api from '../../services/api.js';

const defaultPlatforms = ['youtube', 'web'];
const supportedPlatforms = ['youtube', 'twitter', 'telegram', 'web'];
const scanStatusFilters = ['', 'queued', 'running', 'completed', 'failed'];
const scanPlatformFilters = ['', 'youtube', 'twitter', 'telegram', 'web'];

function statusDisplay(job) {
	if (job.status === 'running') return { label: 'Scanning', icon: Activity, variant: 'warning' };
	if (job.status === 'completed' && Number(job.violationsCount || 0) > 0) return { label: 'Violations Found', icon: AlertCircle, variant: 'danger' };
	if (job.status === 'completed') return { label: 'Complete', icon: CheckCircle2, variant: 'success' };
	if (job.status === 'failed') return { label: 'Failed', icon: AlertCircle, variant: 'danger' };
	return { label: 'Queued', icon: Clock, variant: 'info' };
}

export default function DashboardScansPage() {
	const [scanJobs, setScanJobs] = useState([]);
	const [assets, setAssets] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isRunningScheduled, setIsRunningScheduled] = useState(false);
	const [isRetryingAll, setIsRetryingAll] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [error, setError] = useState('');
	const [filters, setFilters] = useState({
		status: '',
		platform: '',
	});
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 1,
	});
	const [formState, setFormState] = useState({
		assetId: '',
		keywords: '',
		platforms: defaultPlatforms,
		multiLanguage: false,
	});
	const [isSuggesting, setIsSuggesting] = useState(false);

	const runningCount = useMemo(
		() => scanJobs.filter((job) => job.status === 'queued' || job.status === 'running').length,
		[scanJobs],
	);

	const loadAssets = useCallback(async () => {
		try {
			const response = await api.get('/assets?page=1&limit=100');
			const items = response.data.items || [];
			setAssets(items);

			if (!formState.assetId && items.length > 0) {
				setFormState((current) => ({ ...current, assetId: items[0]._id }));
			}
		} catch {
			// Silent fail here; scans page can still render with existing jobs.
		}
	}, [formState.assetId]);

	const loadScans = useCallback(async () => {
		try {
			const response = await api.get('/scans', {
				params: {
					page: pagination.page,
					limit: pagination.limit,
					status: filters.status || undefined,
					platform: filters.platform || undefined,
				},
			});
			setScanJobs(response.data.items || []);
			setPagination((current) => ({
				...current,
				total: response.data.total || 0,
				totalPages: response.data.totalPages || 1,
			}));
			setError('');
		} catch {
			setError('Unable to load scans right now.');
		}
	}, [filters.platform, filters.status, pagination.limit, pagination.page]);

	useEffect(() => {
		let mounted = true;

		async function bootstrap() {
			setIsLoading(true);
			await Promise.all([loadAssets(), loadScans()]);
			if (mounted) {
				setIsLoading(false);
			}
		}

		bootstrap();

		return () => {
			mounted = false;
		};
	}, [loadAssets, loadScans]);

	const [searchParams] = useSearchParams();

	useEffect(() => {
		if (searchParams.get('openModal') === 'true') {
			setIsModalOpen(true);
		}
	}, [searchParams]);

	useEffect(() => {
		if (runningCount === 0) {
			return undefined;
		}

		const timer = setInterval(() => {
			loadScans();
		}, 5000);

		return () => clearInterval(timer);
	}, [runningCount, loadScans]);

	const handleTogglePlatform = (platform) => {
		setFormState((current) => {
			const hasPlatform = current.platforms.includes(platform);
			const platforms = hasPlatform
				? current.platforms.filter((item) => item !== platform)
				: [...current.platforms, platform];

			return {
				...current,
				platforms,
			};
		});
	};

	const handleSuggestKeywords = async () => {
		if (!formState.assetId) {
			toast.error('Please select an asset first to suggest keywords.');
			return;
		}
		
		setIsSuggesting(true);
		try {
			const response = await api.post(`/assets/${formState.assetId}/suggest-keywords`);
			const suggestedKeywords = response.data.keywords || [];
			
			if (suggestedKeywords.length > 0) {
				setFormState((current) => ({
					...current,
					keywords: suggestedKeywords.join(', '),
				}));
				toast.success('AI suggestions applied!');
			} else {
				toast.error('No keywords suggested by AI.');
			}
		} catch (requestError) {
			toast.error('Failed to suggest keywords.');
		} finally {
			setIsSuggesting(false);
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		const keywords = formState.keywords
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);

		if (!formState.assetId) {
			toast.error('Please select an asset first.');
			return;
		}

		if (keywords.length === 0) {
			toast.error('Please add at least one keyword.');
			return;
		}

		if (formState.platforms.length === 0) {
			toast.error('Please select at least one platform.');
			return;
		}

		setIsSubmitting(true);

		try {
			await api.post('/scans/start', {
				assetId: formState.assetId,
				searchKeywords: keywords,
				platforms: formState.platforms,
				multiLanguage: formState.multiLanguage,
			});

			toast.success('Scan started successfully.');
			setIsModalOpen(false);
			setFormState((current) => ({
				...current,
				keywords: '',
				platforms: defaultPlatforms,
			}));
			await loadScans();
		} catch (requestError) {
			const message = requestError.response?.data?.message || 'Failed to start scan.';
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRetry = async (jobId) => {
		try {
			await api.post(`/scans/${jobId}/retry`);
			toast.success('Scan re-queued successfully.');
			await loadScans();
		} catch (requestError) {
			const message = requestError.response?.data?.message || 'Failed to retry scan job.';
			toast.error(message);
		}
	};

	const handleRetryAllFailed = async () => {
		const failedJobs = scanJobs.filter((job) => job.status === 'failed');
		if (failedJobs.length === 0) {
			toast.error('No failed scans to retry.');
			return;
		}
		setIsRetryingAll(true);
		try {
			await Promise.all(failedJobs.map((job) => api.post(`/scans/${job._id}/retry`)));
			toast.success(`Re-queued ${failedJobs.length} failed scan${failedJobs.length === 1 ? '' : 's'}.`);
			await loadScans();
		} catch {
			toast.error('Some scans could not be retried.');
		} finally {
			setIsRetryingAll(false);
		}
	};

	const handleRunScheduledNow = async () => {
		setIsRunningScheduled(true);
		try {
			const response = await api.post('/scans/run-scheduled');
			const count = response.data?.queuedJobs || 0;
			toast.success(`Queued ${count} scheduled scan${count === 1 ? '' : 's'}.`);
			await loadScans();
		} catch (requestError) {
			const message = requestError.response?.data?.message || 'Failed to queue scheduled scans.';
			toast.error(message);
		} finally {
			setIsRunningScheduled(false);
		}
	};

	const handlePageChange = (nextPage) => {
		setPagination((current) => {
			const boundedPage = Math.min(Math.max(1, nextPage), Math.max(1, current.totalPages));
			return {
				...current,
				page: boundedPage,
			};
		});
	};

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

	return (
		<div className='space-y-6'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h2 className='text-2xl font-semibold text-(--app-color-text)'>Scan management</h2>
					<p className='text-sm text-(--app-color-text-muted)'>Queue scans, monitor progress, and review discovered results.</p>
				</div>
				<div className='flex items-center gap-2'>
					{scanJobs.some((job) => job.status === 'failed') && (
						<Button variant='secondary' onClick={handleRetryAllFailed} loading={isRetryingAll} disabled={isRetryingAll} className="flex items-center gap-2">
							<RotateCcw size={16} />
							Retry All Failed
						</Button>
					)}
					<Button variant='secondary' onClick={handleRunScheduledNow} loading={isRunningScheduled} disabled={isRunningScheduled} className="flex items-center gap-2">
						<CalendarClock size={16} />
						Run Scheduled Now
					</Button>
					<Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
						<Play size={16} fill="currentColor" />
						Start New Scan
					</Button>
				</div>
			</div>

			<section className='grid gap-6 sm:grid-cols-3'>
				<Card className='border-(--app-color-border) shadow-sm group hover:border-(--app-color-primary)/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Total scans</p>
							<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{scanJobs.length}</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) group-hover:scale-110 transition-transform">
							<Search size={22} />
						</div>
					</div>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm group hover:border-emerald-500/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Active scans</p>
							<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{runningCount}</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
							<Activity size={22} className={runningCount > 0 ? 'animate-pulse' : ''} />
						</div>
					</div>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm group hover:border-(--app-color-primary)/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Assets available</p>
							<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{assets.length}</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) group-hover:scale-110 transition-transform">
							<Layers size={22} />
						</div>
					</div>
				</Card>
			</section>

			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
				title='Scan jobs'
				subtitle='Statuses auto-refresh every 5 seconds while scanning.'
			>
				<div className='mb-6 grid gap-6 sm:grid-cols-3 items-end'>
					<Select
						label='Status'
						value={filters.status}
						onChange={(event) => handleFilterChange('status', event.target.value)}
						options={scanStatusFilters.map(s => ({
							label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All statuses',
							value: s
						}))}
					/>
					<Select
						label='Platform'
						value={filters.platform}
						onChange={(event) => handleFilterChange('platform', event.target.value)}
						options={scanPlatformFilters.map(p => ({
							label: p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All platforms',
							value: p
						}))}
					/>
					<div className='pb-0.5'>
						<Button
							type='button'
							variant='secondary'
							fullWidth
							className="h-[42px]"
							onClick={() => {
								handleFilterChange('status', '');
								handleFilterChange('platform', '');
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
						<p className="font-bold uppercase tracking-widest animate-pulse">Syncing scan records...</p>
					</div>
				) : scanJobs.length === 0 ? (
					<EmptyState title='No scans yet' message='Start a new scan to begin discovery.' />
				) : (
					<div className='space-y-3'>
						{scanJobs.map((job) => (
							<div 
								key={job._id} 
								onClick={() => (window.location.href = `/dashboard/scans/${job._id}`)}
								className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) px-4 py-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-(--app-color-primary)/30 group/scan'
							>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<div>
										<p className='text-base font-bold text-(--app-color-text) uppercase tracking-tight'>{job.assetId?.title || 'System Asset'}</p>
										<p className='text-[10px] text-(--app-color-text-muted) font-mono uppercase tracking-widest'>Last Updated: {new Date(job.updatedAt || job.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
									</div>
									<Badge variant={statusDisplay(job).variant} size='sm' className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
										{(() => {
											const StatusIcon = statusDisplay(job).icon;
											return <StatusIcon size={12} />;
										})()}
										{statusDisplay(job).label}
									</Badge>
								</div>

								{job.status === 'running' && (
									<div className="mt-3 space-y-1.5">
										<div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-(--app-color-primary)">
											<span>Intelligence Discovery</span>
											<span>{job.progress || 0}%</span>
										</div>
										<div className="h-1.5 w-full overflow-hidden rounded-full bg-(--app-color-primary-soft)">
											<div 
												className="h-full bg-(--app-color-primary) transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(var(--app-color-primary-rgb),0.5)]" 
												style={{ width: `${job.progress || 0}%` }}
											/>
										</div>
									</div>
								)}

								<div className='mt-4 grid gap-4 text-xs text-(--app-color-text-muted) sm:grid-cols-3 border-t border-(--app-color-border)/50 pt-3'>
									<div className="flex items-center gap-2">
										<Globe size={14} className="text-(--app-color-primary)" />
										<span>Platforms: <span className="font-bold text-(--app-color-text)">{job.platforms?.join(', ') || '-'}</span></span>
									</div>
									<div className="flex items-center gap-2">
										<Target size={14} className="text-(--app-color-primary)" />
										<span>Results: <span className="font-bold text-(--app-color-text)">{job.resultsCount || 0}</span></span>
									</div>
									<div className="flex items-center gap-2">
										<AlertCircle size={14} className="text-red-500" />
										<span>Violations: <span className="font-bold text-(--app-color-text)">{job.violationsCount || 0}</span></span>
									</div>
								</div>
								{job.lastError ? (
									<div className="mt-3 rounded-lg bg-red-50/50 border border-red-100 p-2.5">
										<div className="flex items-center gap-2 mb-1">
											<AlertCircle size={12} className="text-red-600" />
											<span className="text-[10px] font-black uppercase tracking-widest text-red-600">Diagnostic Report</span>
										</div>
										<p className='text-xs text-red-800 line-clamp-2'>{job.lastError}</p>
									</div>
								) : null}
								<div className='mt-4 flex items-center gap-6'>
									<Link 
										to={`/dashboard/scans/${job._id}`} 
										onClick={(e) => e.stopPropagation()}
										className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-(--app-color-primary) hover:bg-(--app-color-primary-soft) px-2 py-1 -ml-2 rounded-lg transition-all duration-200'
									>
										<Eye size={14} />
										View results
									</Link>
									<Link 
										to={`/dashboard/assets?assetId=${job.assetId?._id || job.assetId}`} 
										onClick={(e) => e.stopPropagation()}
										className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-(--app-color-primary) px-2 py-1 rounded-lg transition-all duration-200'
									>
										<Layers size={14} />
										View asset
									</Link>
									{job.status === 'failed' ? (
										<button
											type='button'
											onClick={(e) => { e.stopPropagation(); handleRetry(job._id); }}
											className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 hover:opacity-80 transition-opacity'
										>
											<RotateCcw size={14} />
											Retry
										</button>
									) : null}
								</div>
							</div>
						))}
						{pagination.totalPages > 1 ? (
							<Pagination
								currentPage={pagination.page}
								totalPages={pagination.totalPages}
								hasPreviousPage={pagination.page > 1}
								hasNextPage={pagination.page < pagination.totalPages}
								onPageChange={handlePageChange}
								className='pt-2'
							/>
						) : null}
					</div>
				)}
			</Card>

			<Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title='Start New Scan' size='lg'>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div>
						<label className='mb-1 block text-sm font-medium text-(--app-color-text)'>Choose asset</label>
						<select
							value={formState.assetId}
							onChange={(event) => setFormState((current) => ({ ...current, assetId: event.target.value }))}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						>
							<option value=''>Select asset</option>
							{assets.map((asset) => (
								<option key={asset._id} value={asset._id}>
									{asset.title}
								</option>
							))}
						</select>
					</div>

					<div>
						<div className='mb-1 flex items-center justify-between'>
							<label className='block text-sm font-medium text-(--app-color-text)'>Search keywords</label>
							<button 
								type='button' 
								onClick={handleSuggestKeywords} 
								disabled={isSuggesting || !formState.assetId}
								className='text-xs font-semibold text-(--app-color-primary) hover:underline disabled:opacity-50'
							>
								{isSuggesting ? '✨ Thinking...' : '✨ Auto-suggest with AI'}
							</button>
						</div>
						<input
							type='text'
							value={formState.keywords}
							onChange={(event) => setFormState((current) => ({ ...current, keywords: event.target.value }))}
							placeholder='e.g. goal highlight, final match clip'
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						/>
						<p className='mt-1 text-xs text-(--app-color-text-muted)'>Comma separated keywords.</p>
					</div>

					<div>
						<p className='mb-2 text-sm font-medium text-(--app-color-text)'>Platforms</p>
						<div className='flex flex-wrap gap-2'>
							{supportedPlatforms.map((platform) => {
								const active = formState.platforms.includes(platform);

								return (
									<button
										key={platform}
										type='button'
										onClick={() => handleTogglePlatform(platform)}
										className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
											active
												? 'border-(--app-color-primary) bg-(--app-color-primary-soft) text-(--app-color-primary)'
												: 'border-(--app-color-border) bg-(--app-color-surface) text-(--app-color-text-muted)'
										}`}
									>
										{platform}
									</button>
								);
							})}
						</div>
					</div>

					<div className='flex items-center gap-2'>
						<input
							type='checkbox'
							id='multiLanguage'
							checked={formState.multiLanguage}
							onChange={(event) => setFormState((current) => ({ ...current, multiLanguage: event.target.checked }))}
							className='h-4 w-4 rounded border-(--app-color-border) text-(--app-color-primary) focus:ring-(--app-color-primary)'
						/>
						<label htmlFor='multiLanguage' className='text-sm text-(--app-color-text)'>
							Enable Multi-language Scan <span className='text-xs text-(--app-color-text-muted)'>(Translates keywords to 5 languages)</span>
						</label>
					</div>

					<div className='flex justify-end gap-2'>
						<Button type='button' variant='secondary' onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type='submit' loading={isSubmitting} disabled={isSubmitting}>
							Start scan
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}