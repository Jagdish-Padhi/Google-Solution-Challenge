import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { Badge, Button, Card, EmptyState, Modal, Pagination, Spinner } from '../../components';
import api from '../../services/api.js';

const statusFilters = ['', 'open', 'reported', 'resolved', 'false_positive'];
const platformFilters = ['', 'youtube', 'twitter', 'telegram', 'web'];
const statusOptions = ['open', 'reported', 'resolved', 'false_positive'];

function confidenceVariant(value) {
	if (value >= 80) {
		return 'danger';
	}
	if (value >= 60) {
		return 'warning';
	}
	if (value >= 30) {
		return 'info';
	}
	return 'secondary';
}

export default function DashboardViolationsPage() {
	const [violations, setViolations] = useState([]);
	const [selectedViolation, setSelectedViolation] = useState(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isCapturing, setIsCapturing] = useState(false);
	const [error, setError] = useState('');
	const [filters, setFilters] = useState({
		status: '',
		platform: '',
		minConfidence: 0,
	});
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10,
		totalPages: 1,
	});

	const openCount = useMemo(() => violations.filter((item) => item.status === 'open').length, [violations]);

	const loadViolations = useCallback(async () => {
		try {
			const response = await api.get('/violations', {
				params: {
					page: pagination.page,
					limit: pagination.limit,
					status: filters.status || undefined,
					platform: filters.platform || undefined,
					minConfidence: filters.minConfidence || undefined,
				},
			});

			setViolations(response.data.items || []);
			setPagination((current) => ({
				...current,
				totalPages: response.data.totalPages || 1,
			}));
			setError('');
		} catch {
			setError('Unable to load violations right now.');
		} finally {
			setIsLoading(false);
		}
	}, [filters.minConfidence, filters.platform, filters.status, pagination.limit, pagination.page]);

	useEffect(() => {
		loadViolations();
	}, [loadViolations]);

	const openDetails = async (violationId) => {
		try {
			const response = await api.get(`/violations/${violationId}`);
			setSelectedViolation(response.data.violation || null);
			setIsDetailsOpen(true);
		} catch {
			toast.error('Unable to load violation evidence.');
		}
	};

	const updateStatus = async (violationId, status) => {
		try {
			await api.patch(`/violations/${violationId}/status`, { status });
			toast.success('Violation status updated.');

			if (selectedViolation?._id === violationId) {
				setSelectedViolation((current) => (current ? { ...current, status } : current));
			}

			await loadViolations();
		} catch {
			toast.error('Unable to update violation status.');
		}
	};

	const captureScreenshot = async () => {
		if (!selectedViolation?._id) {
			return;
		}

		setIsCapturing(true);
		try {
			const response = await api.post(`/violations/${selectedViolation._id}/screenshot`);
			setSelectedViolation(response.data.violation || selectedViolation);
			toast.success('Evidence screenshot captured.');
			await loadViolations();
		} catch (requestError) {
			const message = requestError.response?.data?.message || 'Unable to capture screenshot.';
			toast.error(message);
		} finally {
			setIsCapturing(false);
		}
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
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<h2 className='text-2xl font-semibold text-(--app-color-text)'>Violations</h2>
					<p className='text-sm text-(--app-color-text-muted)'>Monitor matched infringement signals and manage case resolution workflow.</p>
				</div>
				<Badge variant='outline'>Open cases: {openCount}</Badge>
			</div>

			<section className='grid gap-4 sm:grid-cols-3'>
				<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>Total listed</p>
					<p className='mt-2 text-3xl font-semibold text-(--app-color-text)'>{violations.length}</p>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>Open</p>
					<p className='mt-2 text-3xl font-semibold text-(--app-color-text)'>{openCount}</p>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>Resolved</p>
					<p className='mt-2 text-3xl font-semibold text-(--app-color-text)'>
						{violations.filter((item) => item.status === 'resolved').length}
					</p>
				</Card>
			</section>

			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
				title='Detected violations'
				subtitle='Confidence-scored matches from completed scan jobs.'
			>
				<div className='mb-4 grid gap-3 sm:grid-cols-4'>
					<div>
						<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Status</label>
						<select
							value={filters.status}
							onChange={(event) => handleFilterChange('status', event.target.value)}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						>
							{statusFilters.map((status) => (
								<option key={status || 'all'} value={status}>
									{status ? status.replace('_', ' ') : 'All statuses'}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Platform</label>
						<select
							value={filters.platform}
							onChange={(event) => handleFilterChange('platform', event.target.value)}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						>
							{platformFilters.map((platform) => (
								<option key={platform || 'all'} value={platform}>
									{platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'All platforms'}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Min confidence</label>
						<input
							type='number'
							min='0'
							max='100'
							value={filters.minConfidence}
							onChange={(event) => handleFilterChange('minConfidence', Number(event.target.value || 0))}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						/>
					</div>
					<div className='flex items-end'>
						<Button
							type='button'
							variant='secondary'
							onClick={() => {
								handleFilterChange('status', '');
								handleFilterChange('platform', '');
								handleFilterChange('minConfidence', 0);
							}}
						>
							Clear filters
						</Button>
					</div>
				</div>

				{error ? (
					<p className='text-sm text-red-600'>{error}</p>
				) : isLoading ? (
					<div className='flex items-center gap-3 text-sm text-(--app-color-text-muted)'>
						<Spinner size='sm' />
						Loading violations...
					</div>
				) : violations.length === 0 ? (
					<EmptyState title='No violations found' message='Run scans and complete matching to detect infringement cases.' />
				) : (
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-(--app-color-border) text-sm'>
							<thead>
								<tr className='text-left text-xs uppercase tracking-[0.14em] text-(--app-color-text-muted)'>
									<th className='px-2 py-2'>Platform</th>
									<th className='px-2 py-2'>Source</th>
									<th className='px-2 py-2'>Confidence</th>
									<th className='px-2 py-2'>Status</th>
									<th className='px-2 py-2'>Actions</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-(--app-color-border)'>
								{violations.map((item) => (
									<tr key={item._id}>
										<td className='px-2 py-3 capitalize'>{item.platform}</td>
										<td className='px-2 py-3'>
											<a href={item.sourceUrl} target='_blank' rel='noreferrer' className='text-(--app-color-primary) hover:underline'>
												Open source
											</a>
										</td>
										<td className='px-2 py-3'>
											<Badge variant={confidenceVariant(Number(item.matchConfidence || 0))} size='sm'>
												{item.matchConfidence || 0}%
											</Badge>
										</td>
										<td className='px-2 py-3'>
											<Badge variant='secondary' size='sm'>
												{item.status}
											</Badge>
										</td>
										<td className='px-2 py-3'>
											<div className='flex items-center gap-2'>
												<button
													type='button'
													onClick={() => openDetails(item._id)}
													className='text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-primary) hover:underline'
												>
													View evidence
												</button>
												<select
													value={item.status}
													onChange={(event) => updateStatus(item._id, event.target.value)}
													className='rounded-md border border-(--app-color-border) bg-(--app-color-surface) px-2 py-1 text-xs'
												>
													{statusOptions.map((status) => (
														<option key={status} value={status}>
															{status}
														</option>
													))}
												</select>
											</div>
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

			<Modal
				isOpen={isDetailsOpen}
				onClose={() => setIsDetailsOpen(false)}
				title='Violation evidence'
				size='lg'
			>
				{selectedViolation ? (
					<div className='space-y-4 text-sm'>
						<div className='grid gap-3 sm:grid-cols-2'>
							<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-3'>
								<p className='text-xs uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Match confidence</p>
								<p className='mt-1 text-xl font-semibold text-(--app-color-text)'>{selectedViolation.matchConfidence}%</p>
							</div>
							<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-3'>
								<p className='text-xs uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Match type</p>
								<p className='mt-1 text-xl font-semibold capitalize text-(--app-color-text)'>{selectedViolation.matchType}</p>
							</div>
						</div>

						<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
							<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Evidence explainability</p>
							<div className='mt-3 grid gap-2 sm:grid-cols-3'>
								<p>Hamming distance: <span className='font-semibold'>{selectedViolation.evidenceBundle?.hammingDistance ?? '-'}</span></p>
								<p>Color similarity: <span className='font-semibold'>{selectedViolation.evidenceBundle?.colorSimilarity ?? '-'}</span></p>
								<p>Frame matches: <span className='font-semibold'>{selectedViolation.evidenceBundle?.frameMatchCount ?? '-'}</span></p>
							</div>
						</div>

						<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
							<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Source</p>
							<a href={selectedViolation.sourceUrl} target='_blank' rel='noreferrer' className='mt-1 block text-(--app-color-primary) hover:underline'>
								{selectedViolation.sourceUrl}
							</a>
						</div>

						{selectedViolation.screenshotUrl ? (
							<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
								<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Captured evidence</p>
								<img src={selectedViolation.screenshotUrl} alt='Violation evidence screenshot' className='mt-3 w-full rounded-lg border border-(--app-color-border)' />
							</div>
						) : (
							<div className='rounded-xl border border-dashed border-(--app-color-border) bg-(--app-color-surface) p-4 text-(--app-color-text-muted)'>
								No screenshot captured yet.
							</div>
						)}

						<div className='flex flex-wrap items-center gap-2'>
							<Button variant='secondary' onClick={captureScreenshot} loading={isCapturing} disabled={isCapturing}>
								Capture screenshot
							</Button>
							{statusOptions.map((status) => (
								<Button
									key={status}
									variant={selectedViolation.status === status ? 'primary' : 'secondary'}
									onClick={() => updateStatus(selectedViolation._id, status)}
								>
									Mark {status}
								</Button>
							))}
						</div>
					</div>
				) : (
					<p className='text-sm text-(--app-color-text-muted)'>Select a violation to view details.</p>
				)}
			</Modal>
		</div>
	);
}
