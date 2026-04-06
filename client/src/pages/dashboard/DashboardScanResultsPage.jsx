import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Globe, Radio, Send, Video } from 'lucide-react';

import { Badge, Button, Card, EmptyState, Pagination, Spinner } from '../../components';
import api from '../../services/api.js';

const resultPlatformFilters = ['', 'youtube', 'twitter', 'telegram', 'web'];
const resultStatusFilters = ['', 'pending_match', 'matched', 'no_match'];

function statusVariant(status) {
	if (status === 'completed') {
		return 'success';
	}

	if (status === 'running') {
		return 'warning';
	}

	if (status === 'failed') {
		return 'danger';
	}

	return 'info';
}

function platformIcon(platform) {
	if (platform === 'youtube') {
		return <Video className='h-4 w-4 text-red-600' />;
	}

	if (platform === 'twitter') {
		return <Radio className='h-4 w-4 text-sky-600' />;
	}

	if (platform === 'telegram') {
		return <Send className='h-4 w-4 text-blue-600' />;
	}

	return <Globe className='h-4 w-4 text-slate-600' />;
}

export default function DashboardScanResultsPage() {
	const { jobId } = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [scanJob, setScanJob] = useState(null);
	const [results, setResults] = useState([]);
	const [filters, setFilters] = useState({
		platform: '',
		status: '',
	});
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 20,
		totalPages: 1,
	});

	const loadData = useCallback(async () => {
		try {
			const [statusResponse, resultsResponse] = await Promise.all([
				api.get(`/scans/${jobId}/status`),
				api.get(`/scans/${jobId}/results`, {
					params: {
						page: pagination.page,
						limit: pagination.limit,
						platform: filters.platform || undefined,
						status: filters.status || undefined,
					},
				}),
			]);

			setScanJob(statusResponse.data.scanJob || null);
			setResults(resultsResponse.data.items || []);
			setPagination((current) => ({
				...current,
				totalPages: resultsResponse.data.totalPages || 1,
			}));
			setError('');
		} catch {
			setError('Unable to load scan details right now.');
		} finally {
			setIsLoading(false);
		}
	}, [filters.platform, filters.status, jobId, pagination.limit, pagination.page]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		if (!scanJob || !['queued', 'running'].includes(scanJob.status)) {
			return undefined;
		}

		const timer = setInterval(() => {
			loadData();
		}, 5000);

		return () => clearInterval(timer);
	}, [loadData, scanJob]);

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

	const handlePageChange = (nextPage) => {
		setPagination((current) => ({
			...current,
			page: Math.min(Math.max(1, nextPage), Math.max(1, current.totalPages)),
		}));
	};

	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<h2 className='text-2xl font-semibold text-(--app-color-text)'>Scan results</h2>
					<p className='text-sm text-(--app-color-text-muted)'>Review discovered URLs and platform metadata for this scan job.</p>
				</div>
				<Link to='/dashboard/scans'>
					<Button variant='secondary'>Back to scans</Button>
				</Link>
			</div>

			{error ? <p className='text-sm text-red-600'>{error}</p> : null}

			<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
				{isLoading ? (
					<div className='flex items-center gap-3 text-sm text-(--app-color-text-muted)'>
						<Spinner size='sm' />
						Loading scan details...
					</div>
				) : scanJob ? (
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<div>
							<p className='text-sm font-semibold text-(--app-color-text)'>Scan ID: {scanJob._id}</p>
							<p className='text-xs text-(--app-color-text-muted)'>Platforms: {scanJob.platforms?.join(', ') || '-'}</p>
						</div>
						<Badge variant={statusVariant(scanJob.status)}>{scanJob.status}</Badge>
					</div>
				) : null}
			</Card>

			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
				title='Discovered results'
				subtitle='Rows update as scans complete.'
			>
				<div className='mb-4 grid gap-3 sm:grid-cols-3'>
					<div>
						<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Platform</label>
						<select
							value={filters.platform}
							onChange={(event) => handleFilterChange('platform', event.target.value)}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						>
							{resultPlatformFilters.map((platform) => (
								<option key={platform || 'all'} value={platform}>
									{platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'All platforms'}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Match status</label>
						<select
							value={filters.status}
							onChange={(event) => handleFilterChange('status', event.target.value)}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						>
							{resultStatusFilters.map((status) => (
								<option key={status || 'all'} value={status}>
									{status ? status.replace('_', ' ') : 'All result statuses'}
								</option>
							))}
						</select>
					</div>
					<div className='flex items-end'>
						<Button
							type='button'
							variant='secondary'
							onClick={() => {
								handleFilterChange('platform', '');
								handleFilterChange('status', '');
							}}
						>
							Clear filters
						</Button>
					</div>
				</div>

				{!isLoading && results.length === 0 ? (
					<EmptyState title='No discovered URLs yet' message='Run a scan and results will appear here.' />
				) : (
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-(--app-color-border) text-sm'>
							<thead>
								<tr className='text-left text-xs uppercase tracking-[0.14em] text-(--app-color-text-muted)'>
									<th className='px-2 py-2'>Platform</th>
									<th className='px-2 py-2'>Title</th>
									<th className='px-2 py-2'>URL</th>
									<th className='px-2 py-2'>Status</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-(--app-color-border)'>
								{results.map((result) => (
									<tr key={result._id}>
										<td className='px-2 py-3'>
											<div className='flex items-center gap-2'>
												{platformIcon(result.platform)}
												<span className='capitalize'>{result.platform}</span>
											</div>
										</td>
										<td className='px-2 py-3 text-(--app-color-text)'>{result.pageTitle || '-'}</td>
										<td className='px-2 py-3'>
											<a href={result.sourceUrl} target='_blank' rel='noreferrer' className='text-(--app-color-primary) hover:underline'>
												Open source
											</a>
										</td>
										<td className='px-2 py-3'>
											<Badge variant='secondary' size='sm'>
												{result.status}
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{pagination.totalPages > 1 ? (
					<Pagination
						currentPage={pagination.page}
						totalPages={pagination.totalPages}
						hasPreviousPage={pagination.page > 1}
						hasNextPage={pagination.page < pagination.totalPages}
						onPageChange={handlePageChange}
						className='mt-4'
					/>
				) : null}
			</Card>
		</div>
	);
}