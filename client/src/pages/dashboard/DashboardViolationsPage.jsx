import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { 
	AlertTriangle, 
	CheckCircle, 
	CheckCircle2, 
	Clock, 
	ExternalLink, 
	Eye, 
	Filter, 
	FolderOpen, 
	Gavel, 
	Globe, 
	Hammer, 
	History, 
	Mail, 
	MessageSquare, 
	Send, 
	ShieldCheck, 
	Sparkles, 
	Target, 
	Share2,
	Video, 
	Globe as WebIcon 
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, Loader, Modal, Pagination, Select, Spinner } from '../../components';
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

function statusVariant(status) {
	switch (status) {
		case 'open': return 'danger';
		case 'reported': return 'warning';
		case 'resolved': return 'success';
		case 'false_positive': return 'neutral';
		default: return 'secondary';
	}
}

function statusLabel(status) {
	switch (status) {
		case 'false_positive': return 'False Positive';
		default: return status.charAt(0).toUpperCase() + status.slice(1);
	}
}

const getConfidenceBreakdown = (violation) => {
	const confidence = violation.matchConfidence || 0;
	const eb = violation.evidenceBundle || {};
	
	const hamming = eb.hammingDistance !== null ? eb.hammingDistance : 15;
	const color = eb.colorSimilarity !== null ? eb.colorSimilarity : 0;
	const frames = eb.frameMatchCount !== null ? eb.frameMatchCount : 0;
	const orbVerified = eb.orbVerified || false;
	const visionBoost = eb.visionConfidenceBoost || 0;

	// Calculate base raw scores matching python weighting
	const rawHash = Math.max(0, 100 - (hamming * 7.0)) * 0.55;
	const rawColor = Math.max(0, Math.min(100, color * 100.0)) * 0.30;
	const rawFrames = frames > 0 ? Math.min(15, 5 + frames * 2) : 0;

	let hashVal = rawHash;
	let colorVal = rawColor;
	let frameVal = rawFrames;
	let orbVal = orbVerified ? 30 : 0;
	let visionVal = visionBoost;

	// Sum components
	const totalRaw = hashVal + colorVal + frameVal + orbVal + visionVal;
	
	// Scale components to sum up exactly to reported confidence
	if (totalRaw > 0) {
		const scale = confidence / totalRaw;
		hashVal = Math.round(hashVal * scale);
		colorVal = Math.round(colorVal * scale);
		frameVal = Math.round(frameVal * scale);
		orbVal = Math.round(orbVal * scale);
		visionVal = Math.round(visionVal * scale);
	} else {
		hashVal = confidence;
	}

	// Ensure they sum up exactly to confidence due to rounding
	const sum = hashVal + colorVal + frameVal + orbVal + visionVal;
	const diff = confidence - sum;
	hashVal += diff;

	return {
		pHash: Math.max(0, hashVal),
		color: Math.max(0, colorVal),
		frames: Math.max(0, frameVal),
		orb: Math.max(0, orbVal),
		vision: Math.max(0, visionVal)
	};
};

export default function DashboardViolationsPage() {
	const { violationId } = useParams();
	const [violations, setViolations] = useState([]);
	const [selectedViolation, setSelectedViolation] = useState(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
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
	const [isDraftingDmca, setIsDraftingDmca] = useState(false);
	const [dmcaDraftText, setDmcaDraftText] = useState('');
	const [dmcaContactEmail, setDmcaContactEmail] = useState('');
	const [dmcaSubject, setDmcaSubject] = useState('');
	const [isDmcaModalOpen, setIsDmcaModalOpen] = useState(false);

	useEffect(() => {
		if (violationId) {
			openDetails(violationId);
		}
	}, [violationId]);

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



	const handleDraftDmca = async () => {
		if (!selectedViolation?._id) return;
		setIsDraftingDmca(true);
		try {
			const response = await api.post(`/violations/${selectedViolation._id}/draft-dmca`);
			setDmcaDraftText(response.data.draft || '');
			setDmcaContactEmail(response.data.contactEmail || '');
			setDmcaSubject('URGENT: Formal DMCA Takedown Notice - Copyright Infringement');
			setIsDmcaModalOpen(true);
			toast.success('DMCA drafted successfully.');
		} catch (requestError) {
			const message = requestError.response?.data?.message || 'Failed to draft DMCA notice.';
			toast.error(message);
		} finally {
			setIsDraftingDmca(false);
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

			<section className='grid gap-6 sm:grid-cols-3'>
				<Card className='border-(--app-color-border) shadow-sm group hover:border-(--app-color-primary)/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Total listed</p>
							<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{violations.length}</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) group-hover:scale-110 transition-transform">
							<Gavel size={22} />
						</div>
					</div>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm group hover:border-red-500/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Open cases</p>
							<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{openCount}</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
							<FolderOpen size={22} />
						</div>
					</div>
				</Card>
				<Card className='border-(--app-color-border) shadow-sm group hover:border-emerald-500/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Resolved</p>
							<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>
								{violations.filter((item) => item.status === 'resolved').length}
							</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
							<ShieldCheck size={22} />
						</div>
					</div>
				</Card>
			</section>

			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
				title='Detected violations'
				subtitle='Confidence-scored matches from completed scan jobs.'
			>
				<div className='mb-6 grid gap-6 sm:grid-cols-4 items-end'>
					<Select
						label='Status'
						value={filters.status}
						onChange={(event) => handleFilterChange('status', event.target.value)}
						options={statusFilters.map(s => ({
							label: s ? statusLabel(s) : 'All statuses',
							value: s
						}))}
					/>
					<Select
						label='Platform'
						value={filters.platform}
						onChange={(event) => handleFilterChange('platform', event.target.value)}
						options={platformFilters.map(p => ({
							label: p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All platforms',
							value: p
						}))}
					/>
					<div className="space-y-1">
						<label className='block text-xs font-black uppercase tracking-widest text-(--app-color-text-muted)'>Min confidence (%)</label>
						<input
							type='number'
							min='0'
							max='100'
							value={filters.minConfidence}
							onChange={(event) => handleFilterChange('minConfidence', Number(event.target.value || 0))}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none h-[42px] font-bold'
						/>
					</div>
					<div className='pb-0.5'>
						<Button
							type='button'
							variant='secondary'
							fullWidth
							className="h-[42px] flex items-center justify-center gap-2"
							onClick={() => {
								handleFilterChange('status', '');
								handleFilterChange('platform', '');
								handleFilterChange('minConfidence', 0);
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
						<p className="font-bold uppercase tracking-widest animate-pulse">Scanning for violations...</p>
					</div>
				) : violations.length === 0 ? (
					<EmptyState title='No violations found' message='Run scans and complete matching to detect infringement cases.' />
				) : (
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-(--app-color-border) text-sm'>
							<thead>
								<tr className='text-left text-xs uppercase tracking-[0.14em] text-(--app-color-text-muted)'>
									<th className='px-2 py-2'>Platform</th>
									<th className='px-2 py-2'>Asset</th>
									<th className='px-2 py-2'>Source</th>
									<th className='px-2 py-2'>Confidence</th>
									<th className='px-2 py-2'>Status</th>
									<th className='px-2 py-2'>Actions</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-(--app-color-border)'>
								{violations.map((item) => {
									const PlatformIcon = item.platform === 'youtube' ? Video : (item.platform === 'twitter' ? Share2 : (item.platform === 'telegram' ? MessageSquare : Globe));
									return (
										<tr key={item._id} className="hover:bg-slate-50 transition-colors group">
											<td className='px-2 py-4'>
												<div className="flex items-center gap-2.5">
													<div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
														<PlatformIcon size={16} />
													</div>
													<span className="font-bold capitalize text-(--app-color-text)">{item.platform}</span>
												</div>
											</td>
											<td className='px-2 py-4'>
												<div className='flex flex-col'>
													<span className="font-bold text-(--app-color-text) uppercase tracking-tight line-clamp-1">{item.assetId?.title || 'System Asset'}</span>
												</div>
											</td>
											<td className='px-2 py-4'>
												<a href={item.sourceUrl} target='_blank' rel='noreferrer' className='flex items-center gap-1.5 text-(--app-color-primary) font-bold hover:underline group/link'>
													<ExternalLink size={14} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
													Open source
												</a>
											</td>
											<td className='px-2 py-4'>
												<Badge variant={confidenceVariant(Number(item.matchConfidence || 0))} size='sm' className="font-bold tracking-wider">
													{item.matchConfidence || 0}%
												</Badge>
											</td>
											<td className='px-2 py-4'>
												<Badge variant={statusVariant(item.status)} size='sm' className="font-black uppercase tracking-widest text-[10px]">
													{statusLabel(item.status)}
												</Badge>
											</td>
											<td className='px-2 py-4'>
												<div className='flex items-center gap-3'>
													<button
														type='button'
														onClick={() => openDetails(item._id)}
														className='flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-(--app-color-primary) hover:bg-(--app-color-primary-soft) px-2 py-1 rounded-lg transition-all'
													>
														<Eye size={14} />
														View
													</button>
													<select
														value={item.status}
														onChange={(event) => updateStatus(item._id, event.target.value)}
														className='rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-2 py-1 text-[10px] font-bold uppercase tracking-wider focus:border-(--app-color-primary) focus:outline-none'
													>
														{statusOptions.map((status) => (
															<option key={status} value={status}>
																{statusLabel(status)}
															</option>
														))}
													</select>
												</div>
											</td>
										</tr>
									);
								})}
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
				size='5xl'
			>
				{selectedViolation ? (
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-2 text-sm'>
						{/* Left Column: Details & Actions */}
						<div className='flex flex-col justify-between space-y-4'>
							<div className='space-y-4'>
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

								{/* Confidence Breakdown Bar */}
								<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4 space-y-3'>
									<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Confidence score breakdown</p>
									{(() => {
										const breakdown = getConfidenceBreakdown(selectedViolation);
										const eb = selectedViolation.evidenceBundle || {};
										const rawHash = Math.max(0, 100 - ((eb.hammingDistance ?? 15) * 7.0));
										const rawColor = Math.min(100, (eb.colorSimilarity ?? 0) * 100.0);
										const rawFrames = eb.frameMatchCount ? Math.min(100, eb.frameMatchCount * 20) : 0;
										
										const renderBar = (percent, colorClass) => (
											<div className="w-32 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
												<div style={{ width: `${percent}%` }} className={`h-full ${colorClass}`} />
											</div>
										);

										return (
											<div className="space-y-3 font-mono text-xs">
												<div className="flex items-center justify-between text-slate-600">
													<div className="w-28 font-semibold">pHash Match</div>
													{renderBar(rawHash, 'bg-indigo-500')}
													<div className="w-12 text-right">{Math.round(rawHash)}%</div>
													<div className="w-20 text-right text-indigo-600 font-bold">→ {breakdown.pHash} pts</div>
												</div>
												<div className="flex items-center justify-between text-slate-600">
													<div className="w-28 font-semibold">Color Match</div>
													{renderBar(rawColor, 'bg-teal-500')}
													<div className="w-12 text-right">{Math.round(rawColor)}%</div>
													<div className="w-20 text-right text-teal-600 font-bold">→ {breakdown.color} pts</div>
												</div>
												<div className="flex items-center justify-between text-slate-600">
													<div className="w-28 font-semibold">Frame Match</div>
													{renderBar(rawFrames, 'bg-amber-500')}
													<div className="w-12 text-right">{Math.round(rawFrames)}%</div>
													<div className="w-20 text-right text-amber-600 font-bold">→ {breakdown.frames} pts</div>
												</div>
												
												<div className="h-px bg-slate-200 my-2" />
												
												<div className="flex items-center justify-between text-slate-600">
													<div className="w-28 font-semibold">ORB Verified</div>
													<div className="w-32 hidden sm:block"></div>
													<div className="w-12 text-right font-bold text-emerald-600">{eb.orbVerified ? '✓' : '—'}</div>
													<div className="w-20 text-right text-purple-600 font-bold">→ {breakdown.orb > 0 ? `+${breakdown.orb} boost` : '—'}</div>
												</div>
												<div className="flex items-center justify-between text-slate-600">
													<div className="w-28 font-semibold">Mirror Detect</div>
													<div className="w-32 hidden sm:block"></div>
													<div className="w-12 text-right font-bold text-amber-600">{eb.isMirrored ? '✓' : '—'}</div>
													<div className="w-20 text-right text-slate-400 font-bold text-[10px]">{eb.isMirrored ? '(mirrored copy)' : '—'}</div>
												</div>
												<div className="flex items-center justify-between text-slate-600">
													<div className="w-28 font-semibold">Vision API</div>
													<div className="w-32 hidden sm:block"></div>
													<div className="w-12 text-right font-bold text-emerald-600">{eb.visionAvailable ? '✓' : '—'}</div>
													<div className="w-20 text-right text-emerald-600 font-bold">→ {breakdown.vision > 0 ? `+${breakdown.vision} boost` : '—'}</div>
												</div>
												
												<div className="h-px bg-slate-200 my-2" />
												
												<div className="flex items-center justify-between">
													<div className="w-28 font-black text-slate-800 text-sm">Final Score</div>
													<div className="w-32 hidden sm:block"></div>
													<div className="w-12"></div>
													<div className="w-20 text-right text-(--app-color-primary) font-black text-lg">{selectedViolation.matchConfidence}%</div>
												</div>
											</div>
										);
									})()}
								</div>

								<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
									<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Evidence explainability</p>
									<div className='mt-3 grid gap-2 sm:grid-cols-3'>
										<p className='text-(--app-color-text-muted)'>Hamming: <span className='font-semibold text-(--app-color-text)'>{selectedViolation.evidenceBundle?.hammingDistance ?? '-'}</span></p>
										<p className='text-(--app-color-text-muted)'>Color: <span className='font-semibold text-(--app-color-text)'>{selectedViolation.evidenceBundle?.colorSimilarity ?? '-'}</span></p>
										<p className='text-(--app-color-text-muted)'>Frames: <span className='font-semibold text-(--app-color-text)'>{selectedViolation.evidenceBundle?.frameMatchCount ?? '-'}</span></p>
									</div>
									
									<div className="mt-4 pt-3 border-t border-(--app-color-border)/40 flex flex-wrap gap-2 items-center">
										{selectedViolation.evidenceBundle?.isMirrored && (
											<Badge variant="warning" size="xs" className="font-bold uppercase tracking-wider bg-amber-50 border-amber-200/50 text-amber-700">
												Mirror Piracy Detected
											</Badge>
										)}
										{selectedViolation.evidenceBundle?.orbVerified && (
											<Badge variant="success" size="xs" className="font-bold uppercase tracking-wider bg-emerald-50 border-emerald-200/50 text-emerald-700">
												ORB Homography Verified
											</Badge>
										)}
										<div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5 ml-auto">
											<span>Vision API:</span>
											<span className={selectedViolation.evidenceBundle?.visionAvailable === true ? 'text-emerald-600' : (selectedViolation.evidenceBundle?.visionAvailable === false ? 'text-red-500' : 'text-slate-400')}>
												{selectedViolation.evidenceBundle?.visionAvailable === true ? 'Active' : (selectedViolation.evidenceBundle?.visionAvailable === false ? 'Unavailable' : 'Not Evaluated')}
											</span>
										</div>
									</div>
								</div>

								<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
									<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Source</p>
									<a href={selectedViolation.sourceUrl} target='_blank' rel='noreferrer' className='mt-1 block break-all text-(--app-color-primary) hover:underline'>
										{selectedViolation.sourceUrl}
									</a>
								</div>

								{selectedViolation.discoveryKeyword && (
									<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
										<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Found via search</p>
										<p className='mt-1 font-mono text-xs font-semibold text-(--app-color-text) bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block'>
											{selectedViolation.discoveryKeyword}
										</p>
									</div>
								)}
							</div>

							<div className='pt-6 border-t border-(--app-color-border)/50 space-y-6'>
								<div>
									<p className='mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Primary Enforcement</p>
									<button
										onClick={handleDraftDmca}
										disabled={isDraftingDmca}
										className='group relative flex h-12 items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 to-slate-900 px-8 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-teal-900/20 transition-all hover:scale-[1.02] hover:shadow-teal-900/30 active:scale-95 disabled:opacity-70 whitespace-nowrap'
									>
										<div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700' />
										{isDraftingDmca ? <Spinner size='xs' /> : <Sparkles size={16} className='animate-pulse' />}
										<span>Draft DMCA Notice</span>
									</button>
								</div>

								<div>
									<p className='mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Case Management</p>
									<div className='inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200'>
										{['open', 'reported', 'resolved'].map((status) => (
											<button
												key={status}
												onClick={() => updateStatus(selectedViolation._id, status)}
												className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
													selectedViolation.status === status 
													? 'bg-[var(--app-color-primary)] text-white shadow-md' 
													: 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
												}`}
											>
												{statusLabel(status)}
											</button>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Right Column: Screenshot */}
						<div className='flex h-full flex-col'>
							{selectedViolation.screenshotUrl ? (
								<div className='flex h-full flex-col rounded-xl border border-(--app-color-border) bg-(--app-color-surface) p-4'>
									<p className='mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Captured evidence</p>
									<div className='flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-(--app-color-border) bg-black/5 dark:bg-black/20'>
										<img src={selectedViolation.screenshotUrl} alt='Violation evidence screenshot' className='max-h-[500px] max-w-full object-contain' />
									</div>
								</div>
							) : (
								<div className='flex min-h-[300px] flex-1 items-center justify-center rounded-xl border border-dashed border-(--app-color-border) bg-(--app-color-surface) p-4 text-(--app-color-text-muted)'>
									No screenshot captured yet.
								</div>
							)}
						</div>
					</div>
				) : (
					<p className='text-sm text-(--app-color-text-muted)'>Select a violation to view details.</p>
				)}
			</Modal>

			<Modal
				isOpen={isDmcaModalOpen}
				onClose={() => setIsDmcaModalOpen(false)}
				title='✨ DMCA Takedown Notice'
				size='lg'
			>
				<div className='space-y-4'>
					<div className='overflow-hidden rounded-xl border border-(--app-color-border) bg-(--app-color-surface-panel) shadow-sm'>
						<div className='border-b border-(--app-color-border) bg-(--app-color-surface) px-4 py-3 space-y-2'>
							<div className='flex items-center gap-3 text-sm'>
								<label htmlFor='dmca-to' className='w-14 font-semibold text-(--app-color-text-muted)'>To:</label>
								<input
									id='dmca-to'
									type='email'
									value={dmcaContactEmail}
									onChange={(e) => setDmcaContactEmail(e.target.value)}
									className='flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 font-medium text-(--app-color-text) hover:border-(--app-color-border) focus:border-(--app-color-primary) focus:bg-(--app-color-surface-panel) focus:outline-none'
									placeholder='abuse@platform.com'
								/>
							</div>
							<div className='flex items-center gap-3 text-sm'>
								<label htmlFor='dmca-subject' className='w-14 font-semibold text-(--app-color-text-muted)'>Subject:</label>
								<input
									id='dmca-subject'
									type='text'
									value={dmcaSubject}
									onChange={(e) => setDmcaSubject(e.target.value)}
									className='flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 font-medium text-(--app-color-text) hover:border-(--app-color-border) focus:border-(--app-color-primary) focus:bg-(--app-color-surface-panel) focus:outline-none'
								/>
							</div>
						</div>
						<div className='bg-white p-4 dark:bg-(--app-color-surface)'>
							<textarea
								value={dmcaDraftText}
								onChange={(e) => setDmcaDraftText(e.target.value)}
								className='w-full min-h-[200px] max-h-[40vh] overflow-y-auto resize-none bg-transparent text-sm leading-relaxed text-(--app-color-text) focus:outline-none'
								spellCheck={false}
							/>
						</div>
					</div>

					<div className='flex flex-wrap items-center justify-between gap-2 pt-2'>
						<div className='flex items-center gap-2 text-xs font-medium text-(--app-color-text-muted)'>
							<span className='flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'>
								<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
							</span>
							AI Draft Verified & Ready to Send
						</div>
						<div className='flex flex-wrap items-center gap-2'>
							<Button type='button' variant='secondary' onClick={() => setIsDmcaModalOpen(false)}>
								Cancel
							</Button>
							<Button
								type='button'
								variant='secondary'
								onClick={() => {
									navigator.clipboard.writeText(dmcaDraftText);
									toast.success('Draft copied to clipboard!');
								}}
							>
								Copy text
							</Button>
							{dmcaContactEmail && dmcaSubject && (
								<a
									href={`mailto:${dmcaContactEmail}?subject=${encodeURIComponent(dmcaSubject)}&body=${encodeURIComponent(dmcaDraftText)}`}
									className='flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg dark:bg-red-700 dark:hover:bg-red-600'
									target="_blank"
									rel="noreferrer"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
									Send Notice Now
								</a>
							)}
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
}
