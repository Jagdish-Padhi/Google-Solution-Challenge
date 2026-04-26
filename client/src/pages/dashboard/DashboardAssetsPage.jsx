import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

import { Edit2, RefreshCw, Trash2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Loader, Modal, Spinner } from '../../components';
import api from '../../services/api.js';

const acceptedFileTypes = 'video/mp4,video/quicktime,image/jpeg,image/png';

function getStatusBadgeVariant(status) {
	if (status === 'active') {
		return 'success';
	}

	if (status === 'processing') {
		return 'warning';
	}

	return 'secondary';
}

function getFingerprintShortValue(value) {
	if (!value) {
		return 'pending';
	}

	return value.slice(-8);
}

export default function DashboardAssetsPage() {
	const [assets, setAssets] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [selectedAsset, setSelectedAsset] = useState(null);
	const [viewMode, setViewMode] = useState('grid');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [uploadForm, setUploadForm] = useState({
		title: '',
		description: '',
		file: null,
	});
	const [editForm, setEditForm] = useState({
		id: '',
		title: '',
		description: '',
	});

	const totalAssets = assets.length;
	const processingCount = useMemo(() => assets.filter((asset) => asset.status === 'processing').length, [assets]);

	async function loadAssets(isBackground = false) {
		if (!isBackground) setIsLoading(true);
		setError('');

		try {
			const response = await api.get('/assets?page=1&limit=24');
			setAssets(response.data.items || []);
		} catch {
			if (!isBackground) setError('Unable to load assets right now.');
		} finally {
			if (!isBackground) setIsLoading(false);
		}
	}

	useEffect(() => {
		loadAssets();
	}, []);

	const [searchParams] = useSearchParams();
	useEffect(() => {
		if (searchParams.get('openModal') === 'true') {
			setIsUploadModalOpen(true);
		}
	}, [searchParams]);

	useEffect(() => {
		if (processingCount === 0) {
			return undefined;
		}

		const timer = setInterval(() => {
			loadAssets(true);
		}, 4000);

		return () => clearInterval(timer);
	}, [processingCount]);

	const handleOpenDetail = async (asset) => {
		setSelectedAsset(asset);
		setIsDetailModalOpen(true);

		try {
			const response = await api.get(`/assets/${asset._id}`);
			setSelectedAsset(response.data.asset || asset);
		} catch {
			// Keep already selected asset if detail fetch fails.
		}
	};

	const handleUploadFormChange = (event) => {
		const { name, value } = event.target;
		setUploadForm((current) => ({ ...current, [name]: value }));
	};

	const handleFileSelect = (event) => {
		const file = event.target.files?.[0] || null;
		setUploadForm((current) => ({ ...current, file }));
	};

	const handleUploadSubmit = async (event) => {
		event.preventDefault();

		if (!uploadForm.file) {
			toast.error('Please choose a file before uploading.');
			return;
		}

		setIsSubmitting(true);
		setUploadProgress(0);

		try {
			const payload = new FormData();
			payload.append('title', uploadForm.title.trim());
			payload.append('description', uploadForm.description.trim());
			payload.append('file', uploadForm.file);

			await api.post('/assets/upload', payload, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				onUploadProgress: (progressEvent) => {
					const total = progressEvent.total || 1;
					const percent = Math.round((progressEvent.loaded * 100) / total);
					setUploadProgress(percent);
				},
			});

			setIsUploadModalOpen(false);
			setUploadForm({ title: '', description: '', file: null });
			toast.success('Asset uploaded. Fingerprint processing started.');
			await loadAssets(true);
		} catch (requestError) {
			const message = requestError.response?.data?.message || 'Asset upload failed.';
			toast.error(message);
		} finally {
			setIsSubmitting(false);
			setUploadProgress(0);
		}
	};

	const handleDeleteAsset = async (assetId) => {
		if (!window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
			return;
		}

		try {
			await api.delete(`/assets/${assetId}`);
			toast.success('Asset deleted successfully.');
			setAssets((prev) => prev.filter((a) => a._id !== assetId));
		} catch {
			toast.error('Failed to delete asset.');
		}
	};

	const handleRetryAsset = async (assetId) => {
		try {
			await api.post(`/assets/${assetId}/retry`);
			toast.success('Retry started.');
			await loadAssets(true);
		} catch {
			toast.error('Failed to retry analysis.');
		}
	};

	const handleOpenEdit = (asset) => {
		setEditForm({
			id: asset._id,
			title: asset.title,
			description: asset.description || '',
		});
		setIsEditModalOpen(true);
	};

	const handleEditSubmit = async (event) => {
		event.preventDefault();
		setIsSubmitting(true);

		try {
			await api.patch(`/assets/${editForm.id}/update`, {
				title: editForm.title.trim(),
				description: editForm.description.trim(),
			});
			toast.success('Asset updated successfully.');
			setIsEditModalOpen(false);
			await loadAssets(true);
		} catch (error) {
			const message = error.response?.data?.message || 'Update failed.';
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-8'>
			<section className='grid gap-4 sm:grid-cols-3'>
				<Card className='border-(--app-color-border) shadow-lg shadow-slate-900/5' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>Total assets</p>
					<p className='mt-2 text-3xl font-semibold text-(--app-color-text)'>{totalAssets}</p>
				</Card>
				<Card className='border-(--app-color-border) shadow-lg shadow-slate-900/5' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>Processing now</p>
					<p className='mt-2 text-3xl font-semibold text-(--app-color-text)'>{processingCount}</p>
				</Card>
				<Card className='border-(--app-color-border) shadow-lg shadow-slate-900/5' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>Supported formats</p>
					<p className='mt-2 text-sm text-(--app-color-text)'>MP4, MOV, JPEG, PNG</p>
				</Card>
			</section>

			<section className='rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-panel) p-4 shadow-sm'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<div>
						<h2 className='text-xl font-semibold text-(--app-color-text)'>Asset library</h2>
						<p className='text-sm text-(--app-color-text-muted)'>Upload, inspect, and track content fingerprints.</p>
					</div>

					<div className='flex flex-wrap items-center gap-2'>
						<Button variant={viewMode === 'grid' ? 'primary' : 'secondary'} size='sm' onClick={() => setViewMode('grid')}>
							Grid
						</Button>
						<Button variant={viewMode === 'list' ? 'primary' : 'secondary'} size='sm' onClick={() => setViewMode('list')}>
							List
						</Button>
						<Button size='sm' onClick={() => setIsUploadModalOpen(true)}>
							Upload asset
						</Button>
					</div>
				</div>

				<div className='mt-5'>
					{processingCount > 0 && (
						<div className='mb-4 flex items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-sm text-emerald-700'>
							<Loader size={0.3} />
							<span className="font-bold uppercase tracking-wider">Processing fingerprints for {processingCount} asset{processingCount > 1 ? 's' : ''}...</span>
						</div>
					)}

					{error ? (
						<p className='text-sm text-red-600'>{error}</p>
					) : isLoading ? (
						<div className='flex flex-col items-center justify-center py-12 gap-6 text-sm text-(--app-color-text-muted)'>
							<Loader size={0.6} />
							<p className="font-bold uppercase tracking-widest animate-pulse">Syncing media library...</p>
						</div>
					) : assets.length === 0 ? (
						<EmptyState title='No assets yet' message='Upload your first image or video to create its fingerprint.' />
					) : (
						<div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
							{assets.map((asset) => {
								const isProcessing = asset.status === 'processing';
								const isFailed = asset.status === 'failed';
								
								// Simulate a realistic progress based on upload time
								const timeSinceUpload = (Date.now() - new Date(asset.uploadedAt).getTime()) / 1000;
								const expectedTime = asset.type === 'video' ? 15 : 4;
								const progress = Math.min(Math.round((timeSinceUpload / expectedTime) * 100), 98);
								const timeRemaining = Math.max(Math.round(expectedTime - timeSinceUpload), 1);

								return (
									<Card
										key={asset._id}
										className={`border-(--app-color-border) shadow-sm transition-all duration-300 ${isProcessing ? 'opacity-80' : ''}`}
										style={{ backgroundColor: 'var(--app-color-surface)' }}
										onClick={() => !isProcessing && handleOpenDetail(asset)}
									>
										{asset.type === 'image' && asset.gcsUrl ? (
											<div className="overflow-hidden rounded-lg">
												<img 
													src={asset.gcsUrl} 
													alt={asset.title} 
													className="mb-4 h-36 w-full object-cover" 
												/>
											</div>
										) : null}

										<div className='flex items-start justify-between gap-3'>
											<div className="flex-1 min-w-0">
												<h3 className='text-base font-semibold text-(--app-color-text) truncate'>{asset.title}</h3>
												<p className='mt-0.5 text-[10px] text-(--app-color-text-muted) line-clamp-1 h-4'>{asset.description || 'No description'}</p>
											</div>
											<div className="flex flex-col items-end gap-2">
												<Badge variant={getStatusBadgeVariant(asset.status)} size='sm'>
													{asset.status}
												</Badge>
												<div className="flex items-center gap-1.5 mt-1">
													{isFailed && (
														<button
															onClick={(e) => { e.stopPropagation(); handleRetryAsset(asset._id); }}
															className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
															title="Retry Analysis"
														>
															<RefreshCw size={14} />
														</button>
													)}
													<button
														onClick={(e) => { e.stopPropagation(); handleOpenEdit(asset); }}
														className="p-1.5 rounded-lg bg-(--app-color-surface-elevated) text-(--app-color-text-muted) hover:text-(--app-color-text) hover:bg-(--app-color-border) transition-colors"
														title="Edit Asset"
													>
														<Edit2 size={14} />
													</button>
													<button
														onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset._id); }}
														className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
														title="Delete Asset"
													>
														<Trash2 size={14} />
													</button>
												</div>
											</div>
										</div>

										{isProcessing ? (
											<div className="mt-4 space-y-2">
												<div className="flex justify-between text-[10px] uppercase tracking-widest text-(--app-color-text-muted)">
													<span>{timeSinceUpload > expectedTime ? 'Finalizing...' : 'AI Fingerprinting...'}</span>
													<span>{progress}%</span>
												</div>
												<div className="h-1.5 w-full overflow-hidden rounded-full bg-(--app-color-surface-elevated)">
													<div 
														className="h-full bg-linear-to-r from-(--app-color-primary) to-emerald-400 transition-all duration-1000 ease-out" 
														style={{ width: `${progress}%` }} 
													/>
												</div>
												<p className="text-[10px] text-center text-(--app-color-text-muted)">
													{timeSinceUpload > expectedTime ? 'Analysis taking longer than usual...' : `Estimated completion in ~${timeRemaining}s`}
												</p>
											</div>
										) : (
											<div className="mt-4 pt-4 border-t border-(--app-color-border)">
												<div className="flex items-center justify-between">
													<span className='text-[10px] uppercase tracking-wider text-(--app-color-text-muted)'>{asset.type}</span>
													<span className="text-[10px] text-(--app-color-text-muted)">{new Date(asset.uploadedAt).toLocaleDateString()}</span>
												</div>
												<div className="mt-2 flex items-center justify-between">
													<p className='text-xs text-(--app-color-text-muted)'>Violations: <span className="text-red-400 font-medium">{asset.violationsFound || 0}</span></p>
													<p className='text-xs text-(--app-color-text-muted)'>PHash: <span className="text-(--app-color-text)">{getFingerprintShortValue(asset.fingerprint?.pHash)}</span></p>
												</div>
											</div>
										)}
									</Card>
								);
							})}
						</div>
					)}
				</div>
			</section>

			<Modal isOpen={isUploadModalOpen} onClose={() => !isSubmitting && setIsUploadModalOpen(false)} title='Upload Asset' size='lg'>
				<form className='space-y-4' onSubmit={handleUploadSubmit}>
					<div>
						<label className='mb-1 block text-sm font-medium text-(--app-color-text)'>Asset title</label>
						<input
							type='text'
							name='title'
							value={uploadForm.title}
							onChange={handleUploadFormChange}
							placeholder='Example: Matchday Highlight Reel'
							required
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						/>
					</div>

					<div>
						<label className='mb-1 block text-sm font-medium text-(--app-color-text)'>Description</label>
						<textarea
							name='description'
							value={uploadForm.description}
							onChange={handleUploadFormChange}
							placeholder='Add context about this asset...'
							rows={3}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						/>
					</div>

					<div className='rounded-xl border border-dashed border-(--app-color-border) bg-(--app-color-surface) p-5'>
						<label className='mb-2 block text-sm font-medium text-(--app-color-text)'>Select file</label>
						<input type='file' accept={acceptedFileTypes} onChange={handleFileSelect} required className='w-full text-sm text-(--app-color-text-muted)' />
						<p className='mt-2 text-xs text-(--app-color-text-muted)'>Accepted formats: MP4, MOV, JPEG, PNG.</p>
					</div>

					{isSubmitting && (
						<div className='space-y-2'>
							<div className='h-2 w-full overflow-hidden rounded-full bg-(--app-color-surface-elevated)'>
								<div className='h-full bg-(--app-color-primary) transition-all duration-300' style={{ width: `${uploadProgress}%` }} />
							</div>
							<p className='text-xs text-(--app-color-text-muted)'>Uploading... {uploadProgress}%</p>
						</div>
					)}

					<div className='flex justify-end gap-2'>
						<Button type='button' variant='secondary' onClick={() => setIsUploadModalOpen(false)} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type='submit' loading={isSubmitting} disabled={isSubmitting}>
							Upload and fingerprint
						</Button>
					</div>
				</form>
			</Modal>

			<Modal isOpen={isEditModalOpen} onClose={() => !isSubmitting && setIsEditModalOpen(false)} title='Edit Asset' size='md'>
				<form className='space-y-4' onSubmit={handleEditSubmit}>
					<div>
						<label className='mb-1 block text-sm font-medium text-(--app-color-text)'>Asset title</label>
						<input
							type='text'
							value={editForm.title}
							onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
							required
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						/>
					</div>

					<div>
						<label className='mb-1 block text-sm font-medium text-(--app-color-text)'>Description</label>
						<textarea
							value={editForm.description}
							onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
							rows={3}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						/>
					</div>

					<div className='flex justify-end gap-2 pt-2'>
						<Button type='button' variant='secondary' onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type='submit' loading={isSubmitting} disabled={isSubmitting}>
							Save changes
						</Button>
					</div>
				</form>
			</Modal>

			<Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title='Asset Details' size='lg'>
				{selectedAsset ? (
					<div className='space-y-3 text-sm text-(--app-color-text-muted)'>
						<p>
							<span className='font-semibold text-(--app-color-text)'>Title:</span> {selectedAsset.title}
						</p>
						<p>
							<span className='font-semibold text-(--app-color-text)'>Description:</span> {selectedAsset.description || 'N/A'}
						</p>
						<p>
							<span className='font-semibold text-(--app-color-text)'>Type:</span> {selectedAsset.type}
						</p>
						<p>
							<span className='font-semibold text-(--app-color-text)'>Status:</span> {selectedAsset.status}
						</p>
						<p>
							<span className='font-semibold text-(--app-color-text)'>Fingerprint (last 8):</span>{' '}
							{getFingerprintShortValue(selectedAsset.fingerprint?.pHash)}
						</p>
						<p>
							<span className='font-semibold text-(--app-color-text)'>Video hash:</span>{' '}
							{getFingerprintShortValue(selectedAsset.fingerprint?.videoHash)}
						</p>
						<p>
							<span className='font-semibold text-(--app-color-text)'>Violations found:</span>{' '}
							{selectedAsset.violationsFound || 0}
						</p>
					</div>
				) : (
					<div className='flex items-center gap-2 text-sm text-(--app-color-text-muted)'>
						<Spinner size='sm' />
						Loading asset detail...
					</div>
				)}
			</Modal>
		</div>
	);
}