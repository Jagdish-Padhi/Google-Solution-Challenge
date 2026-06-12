import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
	Activity, 
	AlertTriangle, 
	Calendar, 
	Edit2, 
	ExternalLink, 
	Play, 
	Plus, 
	Radio, 
	Save, 
	Square, 
	Tv, 
	Trash2, 
	Eye
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, Loader, Modal } from '../../components';
import api from '../../services/api.js';

export default function DashboardStreamsPage() {
	const navigate = useNavigate();
	const [streams, setStreams] = useState([]);
	const [activeJobs, setActiveJobs] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	
	const [addForm, setAddForm] = useState({
		title: '',
		description: '',
		platform: 'custom',
		livestreamUrl: '',
	});

	const [editForm, setEditForm] = useState({
		id: '',
		title: '',
		description: '',
	});

	// Compute Stream Stats
	const totalStreams = streams.length;
	
	const streamsWithJobs = useMemo(() => {
		return streams.map(stream => {
			// Find latest active or completed scan job for this asset
			const job = activeJobs.find(j => j.assetId?._id === stream._id || j.assetId === stream._id);
			return {
				...stream,
				activeJob: job || null
			};
		});
	}, [streams, activeJobs]);

	const monitoringCount = useMemo(() => {
		return streamsWithJobs.filter(s => s.activeJob?.status === 'monitoring').length;
	}, [streamsWithJobs]);

	const totalViolations = useMemo(() => {
		return streams.reduce((sum, s) => sum + (s.violationsFound || 0), 0);
	}, [streams]);

	// Load registered livestream assets and scan jobs
	const loadData = useCallback(async (isBackground = false) => {
		if (!isBackground) setIsLoading(true);
		setError('');

		try {
			const [assetsResponse, scansResponse] = await Promise.all([
				api.get('/assets?page=1&limit=100'),
				api.get('/scans?page=1&limit=100')
			]);

			// Filter only livestream assets
			const allAssets = assetsResponse.data.items || [];
			const filteredStreams = allAssets.filter(asset => asset.type === 'livestream');
			setStreams(filteredStreams);

			// Save all scans to match against active jobs
			setActiveJobs(scansResponse.data.items || []);
		} catch {
			if (!isBackground) setError('Unable to load stream details right now.');
		} finally {
			if (!isBackground) setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Auto-refresh when scans are running/monitoring
	useEffect(() => {
		const hasActiveMonitoring = activeJobs.some(job => ['queued', 'running', 'monitoring'].includes(job.status));
		if (!hasActiveMonitoring && monitoringCount === 0) {
			return undefined;
		}

		const timer = setInterval(() => {
			loadData(true);
		}, 5000);

		return () => clearInterval(timer);
	}, [activeJobs, monitoringCount, loadData]);

	// Form actions
	const handleAddChange = (e) => {
		const { name, value } = e.target;
		setAddForm(prev => {
			// Autofill mock URLs for Twitch/Kick to ease user demo — only when platform changes
			if (name === 'platform' && value !== 'custom') {
				const slug = prev.title.trim().toLowerCase().replace(/\s+/g, '-');
				let autofillUrl = prev.livestreamUrl;
				if (value === 'twitch') {
					autofillUrl = `https://www.twitch.tv/${slug || 'demo'}`;
				} else if (value === 'kick') {
					autofillUrl = `https://kick.com/${slug || 'demo'}`;
				}
				return { ...prev, platform: value, livestreamUrl: autofillUrl };
			}
			// All other fields update only themselves — never touch livestreamUrl
			return { ...prev, [name]: value };
		});
	};

	const handleAddSubmit = async (e) => {
		e.preventDefault();
		if (!addForm.livestreamUrl.trim()) {
			toast.error('Please specify a stream URL.');
			return;
		}

		setIsSubmitting(true);
		try {
			await api.post('/assets/upload', {
				title: addForm.title.trim(),
				description: addForm.description.trim(),
				type: 'livestream',
				livestreamUrl: addForm.livestreamUrl.trim(),
			});

			toast.success('Live Stream registered successfully.');
			setIsAddModalOpen(false);
			setAddForm({ title: '', description: '', platform: 'custom', livestreamUrl: '' });
			await loadData(true);
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to register stream.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOpenEdit = (stream) => {
		setEditForm({
			id: stream._id,
			title: stream.title,
			description: stream.description || '',
		});
		setIsEditModalOpen(true);
	};

	const handleEditSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			await api.patch(`/assets/${editForm.id}/update`, {
				title: editForm.title.trim(),
				description: editForm.description.trim(),
			});
			toast.success('Stream information updated.');
			setIsEditModalOpen(false);
			await loadData(true);
		} catch {
			toast.error('Failed to update stream.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteStream = async (streamId) => {
		if (!window.confirm('Delete this livestream channel? Active monitoring scans will be killed.')) {
			return;
		}

		try {
			await api.delete(`/assets/${streamId}`);
			toast.success('Livestream channel removed.');
			await loadData(true);
		} catch {
			toast.error('Failed to delete livestream.');
		}
	};

	// Scan Trigger Controls
	const handleStartMonitoring = async (stream) => {
		const toastId = toast.loading('Dispatching livestream monitor...');
		try {
			const response = await api.post('/scans/start', {
				assetId: stream._id,
				platforms: ['livestream'],
				searchKeywords: [stream.title]
			});
			
			toast.success('Monitoring started!', { id: toastId });
			const jobId = response.data?.scanJob?._id || response.data?._id;
			if (jobId) {
				navigate(`/dashboard/scans/${jobId}`);
			} else {
				await loadData(true);
			}
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to start monitor.', { id: toastId });
		}
	};

	const handleStopMonitoring = async (jobId) => {
		const toastId = toast.loading('Stopping stream capture...');
		try {
			await api.post(`/scans/${jobId}/stop`);
			toast.success('Monitoring stopped successfully.', { id: toastId });
			await loadData(true);
		} catch {
			toast.error('Failed to stop monitor.', { id: toastId });
		}
	};

	return (
		<div className="space-y-8">
			{/* Metric Dashboard */}
			<section className="grid gap-6 sm:grid-cols-3">
				<Card className="border-(--app-color-border) shadow-sm group hover:border-(--app-color-primary)/50 transition-all duration-300" style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)">Channels Tracked</p>
							<p className="text-3xl font-black text-(--app-color-text) tabular-nums">{totalStreams}</p>
						</div>
						<div className="h-12 w-12 rounded-2xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) group-hover:scale-110 transition-transform">
							<Tv size={22} />
						</div>
					</div>
				</Card>
				<Card className="border-(--app-color-border) shadow-sm group hover:border-[var(--app-color-warning)]/50 transition-all duration-300" style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)">Active Audits</p>
							<p className="text-3xl font-black text-(--app-color-text) tabular-nums">{monitoringCount}</p>
						</div>
						<div className={`h-12 w-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${
							monitoringCount > 0 
								? 'bg-[var(--app-color-warning)]/20 text-[var(--app-color-warning)] shadow-[0_0_15px_rgba(180,83,9,0.25)]' 
								: 'bg-[var(--app-color-warning)]/10 text-[var(--app-color-warning)]'
						}`}>
							<Activity size={22} className={monitoringCount > 0 ? 'animate-pulse' : ''} />
						</div>
					</div>
				</Card>
				<Card className="border-(--app-color-border) shadow-sm group hover:border-[var(--app-color-danger)]/50 transition-all duration-300" style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)">Pirated Feeds Found</p>
							<p className="text-3xl font-black text-[var(--app-color-danger)] tabular-nums">{totalViolations}</p>
						</div>
						<div className={`h-12 w-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${
							totalViolations > 0 
								? 'bg-[var(--app-color-danger)]/20 text-[var(--app-color-danger)] shadow-[0_0_15px_rgba(180,35,24,0.25)]' 
								: 'bg-[var(--app-color-danger)]/10 text-[var(--app-color-danger)]'
						}`}>
							<AlertTriangle size={22} className={totalViolations > 0 ? 'animate-bounce' : ''} />
						</div>
					</div>
				</Card>
			</section>

			{/* Main Content Area */}
			<section className="rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-panel) p-4 shadow-sm">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-xl font-semibold text-(--app-color-text)">Live Streams Control Center</h2>
						<p className="text-sm text-(--app-color-text-muted)">Manage authorized streams and audit online broadcasts for piracy.</p>
					</div>

					<Button size="sm" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
						<Plus size={16} />
						Monitor stream
					</Button>
				</div>

				<div className="mt-6">
					{error ? (
						<p className="text-sm text-[var(--app-color-danger)]">{error}</p>
					) : isLoading ? (
						<div className="flex flex-col items-center justify-center py-16 gap-6 text-sm text-(--app-color-text-muted)">
							<Loader size={0.6} />
							<p className="font-bold uppercase tracking-widest animate-pulse">Syncing livestream pipelines...</p>
						</div>
					) : streamsWithJobs.length === 0 ? (
						<EmptyState 
							title="No livestreams monitored yet" 
							message="Register a live broadcast feed (HLS/RTMP URL, Twitch, or Kick channel) to start real-time piracy auditing." 
						/>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{streamsWithJobs.map((stream) => {
								const activeJob = stream.activeJob;
								const isMonitoring = activeJob?.status === 'monitoring';
								const isQueued = ['queued', 'running'].includes(activeJob?.status || '');
								const isFailed = activeJob?.status === 'failed';

								let statusLabel = 'Offline';
								let statusVariant = 'secondary';
								if (isMonitoring) {
									statusLabel = 'Monitoring';
									statusVariant = 'success';
								} else if (isQueued) {
									statusLabel = 'Initializing';
									statusVariant = 'warning';
								} else if (isFailed) {
									statusLabel = 'Failed';
									statusVariant = 'danger';
								}

								return (
									<Card 
										key={stream._id}
										className={`border-(--app-color-border) shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden ${
											isMonitoring ? 'border-[var(--app-color-success)]/30 shadow-[0_0_20px_rgba(21,128,61,0.06)]' : ''
										}`}
										style={{ backgroundColor: 'var(--app-color-surface)' }}
									>
										{isMonitoring && (
											<div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--app-color-success)]/10 via-[var(--app-color-success)] to-[var(--app-color-success)]/10 animate-progress-indefinite" />
										)}
										<div className="space-y-4">
											{/* Header info */}
											<div className="flex items-start justify-between gap-2">
												<div className="space-y-0.5">
													<h3 className="text-base font-bold text-(--app-color-text) truncate">{stream.title}</h3>
													<p className="text-xs text-(--app-color-text-muted) line-clamp-1">{stream.description || 'No description'}</p>
												</div>
												<Badge variant={statusVariant} size="sm" className="flex items-center gap-1.5">
													{isMonitoring && (
														<span className="relative flex h-2 w-2">
															<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--app-color-success)] opacity-75"></span>
															<span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--app-color-success)]"></span>
														</span>
													)}
													{isQueued && (
														<span className="relative flex h-2 w-2">
															<span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-[var(--app-color-warning)] opacity-75"></span>
															<span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--app-color-warning)]"></span>
														</span>
													)}
													{statusLabel}
												</Badge>
											</div>

											{/* Stream Info Content */}
											<div className="rounded-lg bg-(--app-color-surface-elevated) p-3 space-y-2 text-xs">
												<p className="text-(--app-color-text-muted) flex justify-between">
													<span>Source URL:</span>
													<span className="font-mono text-(--app-color-text) truncate max-w-[150px]" title={stream.livestreamUrl}>
														{stream.livestreamUrl}
													</span>
												</p>
												<p className="text-(--app-color-text-muted) flex justify-between">
													<span>Platform:</span>
													<span className="font-bold text-(--app-color-text) capitalize">
														{stream.livestreamUrl.includes('twitch.tv') ? 'Twitch' : stream.livestreamUrl.includes('kick.com') ? 'Kick' : 'HLS/RTMP'}
													</span>
												</p>
												<p className="text-(--app-color-text-muted) flex justify-between">
													<span>Detections:</span>
													<span className={`font-bold ${stream.violationsFound > 0 ? 'text-[var(--app-color-danger)]' : 'text-(--app-color-text)'}`}>
														{stream.violationsFound || 0} hits
													</span>
												</p>
											</div>
										</div>

										{/* Footer Action buttons */}
										<div className="mt-4 pt-4 border-t border-(--app-color-border)/50 flex items-center justify-between">
											<div className="flex items-center gap-1.5">
												<button
													onClick={() => handleOpenEdit(stream)}
													className="p-1.5 rounded-lg bg-(--app-color-surface-elevated) text-(--app-color-text-muted) hover:text-(--app-color-text) hover:bg-(--app-color-border) transition-colors"
													title="Edit Stream"
												>
													<Edit2 size={14} />
												</button>
												<button
													onClick={() => handleDeleteStream(stream._id)}
													className="p-1.5 rounded-lg bg-[var(--app-color-danger)]/10 text-[var(--app-color-danger)] hover:bg-[var(--app-color-danger)]/20 transition-colors"
													title="Delete Stream"
												>
													<Trash2 size={14} />
												</button>
											</div>

											<div className="flex items-center gap-2">
												{activeJob && (
													<Button 
														variant="secondary" 
														size="xs"
														onClick={() => navigate(`/dashboard/scans/${activeJob._id}`)}
														className="flex items-center gap-1.5"
													>
														<Eye size={12} />
														Console
													</Button>
												)}

												{isMonitoring || isQueued ? (
													<Button
														variant="danger"
														size="xs"
														onClick={() => handleStopMonitoring(activeJob._id)}
														className="flex items-center gap-1.5"
													>
														<Square size={10} fill="currentColor" />
														Stop
													</Button>
												) : (
													<Button
														variant="success"
														size="xs"
														onClick={() => handleStartMonitoring(stream)}
														className="flex items-center gap-1.5"
													>
														<Play size={10} fill="currentColor" />
														Audit
													</Button>
												)}
											</div>
										</div>
									</Card>
								);
							})}
						</div>
					)}
				</div>
			</section>

			{/* Add Stream Modal */}
			<Modal isOpen={isAddModalOpen} onClose={() => !isSubmitting && setIsAddModalOpen(false)} title="Monitor Stream URL" size="md">
				<form onSubmit={handleAddSubmit} className="space-y-4">
					<div>
						<label className="mb-1 block text-sm font-medium text-(--app-color-text)">Stream Title</label>
						<input
							type="text"
							name="title"
							value={addForm.title}
							onChange={handleAddChange}
							placeholder="e.g. Arsenal vs Chelsea Live Stream"
							required
							className="w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-(--app-color-text)">Description</label>
						<textarea
							name="description"
							value={addForm.description}
							onChange={handleAddChange}
							placeholder="Add stream notes..."
							rows={2}
							className="w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-(--app-color-text)">Stream Platform Type</label>
						<select
							name="platform"
							value={addForm.platform}
							onChange={handleAddChange}
							className="w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none font-bold"
						>
							<option value="custom">Custom HLS URL (.m3u8)</option>
							<option value="twitch">Twitch (Live Channel)</option>
							<option value="kick">Kick (Live Channel)</option>
						</select>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-(--app-color-text)">Stream Link / URL</label>
						<input
							type="text"
							name="livestreamUrl"
							value={addForm.livestreamUrl}
							onChange={handleAddChange}
							placeholder={addForm.platform === 'custom' ? 'https://example.com/stream.m3u8' : 'Twitch/Kick Channel URL'}
							required
							className="w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="flex items-center gap-2">
							<Radio size={16} />
							Register Channel
						</Button>
					</div>
				</form>
			</Modal>

			{/* Edit Stream Modal */}
			<Modal isOpen={isEditModalOpen} onClose={() => !isSubmitting && setIsEditModalOpen(false)} title="Edit Stream Info" size="md">
				<form onSubmit={handleEditSubmit} className="space-y-4">
					<div>
						<label className="mb-1 block text-sm font-medium text-(--app-color-text)">Stream Title</label>
						<input
							type="text"
							value={editForm.title}
							onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
							required
							className="w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-(--app-color-text)">Description</label>
						<textarea
							value={editForm.description}
							onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
							rows={3}
							className="w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="flex items-center gap-2">
							<Save size={16} />
							Save changes
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
