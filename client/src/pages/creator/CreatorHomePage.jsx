import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
	Camera, 
	CheckCircle2, 
	ChevronRight, 
	FileImage, 
	FileVideo, 
	Globe, 
	Info, 
	Search, 
	Shield, 
	ShieldAlert, 
	ShieldCheck, 
	UploadCloud,
	Zap,
    Download,
    ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge, Button, Card, Spinner, Modal } from '../../components';
import api from '../../services/api.js';

export default function CreatorHomePage() {
	const navigate = useNavigate();
	const [assets, setAssets] = useState([]);
	const [violations, setViolations] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	
	// Upload State
	const fileInputRef = useRef(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	
	// Scan State
	const [isScanning, setIsScanning] = useState(false);
	const [scanProgress, setScanProgress] = useState(0);

    // DMCA Modal State
    const [isDMCAModalOpen, setIsDMCAModalOpen] = useState(false);
    const [selectedViolation, setSelectedViolation] = useState(null);

	const loadData = useCallback(async () => {
		try {
			const [assetsRes, violationsRes] = await Promise.all([
				api.get('/assets?page=1&limit=5'),
				api.get('/violations?page=1&limit=5')
			]);
			
			setAssets(assetsRes.data.items || []);
			setViolations(violationsRes.data.items || []);
		} catch {
			toast.error('Unable to load your portfolio data.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleFileSelect = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const accepted = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png'];
		if (!accepted.includes(file.type)) {
			toast.error('Unsupported file type. Please use MP4, MOV, JPEG, or PNG.');
			return;
		}

		setIsUploading(true);
		setUploadProgress(0);

		try {
			const payload = new FormData();
			payload.append('title', file.name.split('.')[0] || 'Untitled Work');
			payload.append('file', file);

			await api.post('/assets/upload', payload, {
				headers: { 'Content-Type': 'multipart/form-data' },
				onUploadProgress: (progressEvent) => {
					const total = progressEvent.total || 1;
					const percent = Math.round((progressEvent.loaded * 100) / total);
					setUploadProgress(percent);
				},
			});

			toast.success('Work uploaded and fingerprinted successfully.');
			await loadData();
		} catch {
			toast.error('Upload failed. Please try again.');
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	const handleStartScan = async () => {
		if (assets.length === 0) {
			toast.error('Upload some work first before scanning.');
			return;
		}

		setIsScanning(true);
		setScanProgress(0);

		try {
			await api.post('/scans');
			
			// Simulate progress for the "Scan Now" button UX
			for (let i = 1; i <= 100; i += 5) {
				await new Promise((resolve) => setTimeout(resolve, 150));
				setScanProgress(i);
			}
			
			toast.success('Scan complete. Results updated.');
			await loadData();
		} catch {
			toast.error('Failed to start scan.');
		} finally {
			setIsScanning(false);
			setScanProgress(0);
		}
	};

    const handleOpenDMCA = (violation) => {
        setSelectedViolation(violation);
        setIsDMCAModalOpen(true);
    };

	if (isLoading) {
		return (
			<div className='flex h-full flex-col items-center justify-center py-24 gap-6 text-sm text-(--app-color-text-muted)'>
				<Spinner size='md' />
				<p className='font-bold uppercase tracking-widest animate-pulse'>Loading Portfolio...</p>
			</div>
		);
	}

	const hasAssets = assets.length > 0;
	const activeViolations = violations.filter(v => v.status === 'open');

	return (
		<div className='mx-auto max-w-4xl p-6 lg:p-10 space-y-8'>
			{/* Header */}
			<div>
				<h1 className='text-3xl font-black text-(--app-color-text) tracking-tight mb-2'>Protect Your Work</h1>
				<p className='text-base text-(--app-color-text-muted)'>
					Upload your photography and videography to our secure vault. We fingerprint it and scan the web for unauthorized uses.
				</p>
			</div>

			{/* Protection Status Bar */}
			<div className='flex flex-wrap items-center gap-4 p-5 rounded-2xl bg-(--app-color-surface-panel) border border-(--app-color-border) shadow-sm'>
				<div className='flex items-center gap-3'>
					<div className='h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center'>
						<ShieldCheck size={18} className='text-emerald-600' />
					</div>
					<div>
						<p className='text-xl font-black text-(--app-color-text)'>{assets.length}</p>
						<p className='text-[10px] font-black uppercase tracking-widest text-(--app-color-text-muted)'>Works Fingerprinted</p>
					</div>
				</div>
				<div className='h-10 w-px bg-(--app-color-border)/60 mx-2 hidden sm:block' />
				<div className='flex items-center gap-3'>
					<div className={`h-10 w-10 rounded-full border flex items-center justify-center ${activeViolations.length > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
						<ShieldAlert size={18} className={activeViolations.length > 0 ? 'text-red-500' : 'text-slate-400'} />
					</div>
					<div>
						<p className='text-xl font-black text-(--app-color-text)'>{activeViolations.length}</p>
						<p className='text-[10px] font-black uppercase tracking-widest text-(--app-color-text-muted)'>Unauthorized Uses</p>
					</div>
				</div>
				<div className='h-10 w-px bg-(--app-color-border)/60 mx-2 hidden sm:block' />
				<div className='flex items-center gap-3'>
					<div className='h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center'>
						<Globe size={18} className='text-blue-500' />
					</div>
					<div>
						<p className='text-xl font-black text-(--app-color-text)'>4</p>
						<p className='text-[10px] font-black uppercase tracking-widest text-(--app-color-text-muted)'>Platforms Watched</p>
					</div>
				</div>
			</div>

			<div className='grid gap-6 md:grid-cols-[1fr_24px_1fr] items-start'>
				{/* Step 1: Upload */}
				<Card className='relative overflow-hidden border-(--app-color-border) shadow-sm h-full flex flex-col'>
					<div className='p-6 flex-1 flex flex-col'>
						<div className='mb-4 flex items-center gap-3'>
							<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-(--app-color-primary)/10 text-(--app-color-primary) font-black'>1</div>
							<h2 className='text-lg font-bold text-(--app-color-text)'>Upload Your Work</h2>
						</div>
						<p className='text-sm text-(--app-color-text-muted) mb-6 flex-1'>
							Drag and drop your photos or videos. We'll extract a unique AI fingerprint that can't be washed away by cropping or filters.
						</p>

						<input
							type='file'
							ref={fileInputRef}
							onChange={handleFileSelect}
							className='hidden'
							accept='video/mp4,video/quicktime,image/jpeg,image/png'
						/>

						{isUploading ? (
							<div className='rounded-xl border border-dashed border-(--app-color-border) bg-slate-50 p-6 text-center'>
								<Spinner size='md' className='mx-auto mb-3' />
								<p className='text-sm font-bold text-(--app-color-text) mb-1'>Securing fingerprint...</p>
								<div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-200 mt-3'>
									<div className='h-full bg-(--app-color-primary) transition-all duration-300' style={{ width: `${uploadProgress}%` }} />
								</div>
							</div>
						) : (
							<button
								onClick={() => fileInputRef.current?.click()}
								className='group flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--app-color-border) bg-slate-50/50 p-6 transition-all hover:border-(--app-color-primary)/50 hover:bg-(--app-color-primary)/5'
							>
								<div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform'>
									<UploadCloud size={20} className='text-(--app-color-primary)' />
								</div>
								<p className='text-sm font-bold text-(--app-color-text)'>Select File to Protect</p>
								<p className='text-xs text-(--app-color-text-muted) mt-1'>MP4, MOV, JPG, PNG</p>
							</button>
						)}

						{hasAssets && !isUploading && (
							<div className='mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-100'>
								<CheckCircle2 size={14} /> {assets.length} works fingerprinted
							</div>
						)}
					</div>
				</Card>

				{/* Connector */}
				<div className='hidden md:flex h-full items-center justify-center'>
					<ChevronRight size={24} className='text-slate-300' />
				</div>

				{/* Step 2: Scan */}
				<Card className={`relative overflow-hidden border-(--app-color-border) shadow-sm h-full flex flex-col transition-opacity ${!hasAssets ? 'opacity-50 grayscale select-none' : ''}`}>
					<div className='p-6 flex-1 flex flex-col'>
						<div className='mb-4 flex items-center gap-3'>
							<div className={`flex h-8 w-8 items-center justify-center rounded-lg font-black ${hasAssets ? 'bg-(--app-color-primary)/10 text-(--app-color-primary)' : 'bg-slate-100 text-slate-400'}`}>2</div>
							<h2 className='text-lg font-bold text-(--app-color-text)'>Scan for Theft</h2>
						</div>
						<p className='text-sm text-(--app-color-text-muted) mb-6 flex-1'>
							Search YouTube, Twitter, and the broader web for unauthorized copies of your protected works.
						</p>

						<div className='flex flex-wrap gap-2 mb-6'>
							{['YouTube', 'Twitter / X', 'Telegram', 'Web Domains'].map(platform => (
								<Badge key={platform} variant='secondary' size='xs' className='bg-slate-100 text-slate-600 border-slate-200'>{platform}</Badge>
							))}
						</div>

						{isScanning ? (
							<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-canvas-glow) p-5'>
								<div className='flex items-center gap-3 mb-3'>
									<Search size={16} className='text-(--app-color-primary) animate-pulse' />
									<p className='text-xs font-bold text-(--app-color-text) uppercase tracking-widest'>Scanning platforms...</p>
								</div>
								<div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-200'>
									<div className='h-full bg-(--app-color-primary) transition-all duration-300' style={{ width: `${scanProgress}%` }} />
								</div>
							</div>
						) : (
							<Button 
								onClick={handleStartScan} 
								disabled={!hasAssets || isScanning}
								className='w-full h-12 flex items-center justify-center gap-2 font-bold text-sm shadow-md'
							>
								<Search size={16} /> Scan Now
							</Button>
						)}
					</div>
				</Card>
			</div>

			{/* Step 3: Findings */}
			<div className='pt-4'>
				<div className='mb-4 flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-black border border-amber-100'>3</div>
						<h2 className='text-xl font-black text-(--app-color-text) tracking-tight'>Your Findings</h2>
					</div>
					{violations.length > 0 && (
						<button onClick={() => navigate('/creator/findings')} className='text-sm font-semibold text-(--app-color-primary) hover:underline'>
							View All →
						</button>
					)}
				</div>

				{!hasAssets ? (
					<div className='rounded-2xl border border-dashed border-(--app-color-border) p-10 text-center bg-slate-50/50'>
						<Shield size={32} className='mx-auto mb-3 text-slate-300' />
						<p className='text-sm font-bold text-(--app-color-text)'>No works protected yet</p>
						<p className='text-xs text-(--app-color-text-muted) mt-1'>Upload your first photo or video above.</p>
					</div>
				) : violations.length === 0 ? (
					<div className='rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center'>
						<div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
							<CheckCircle2 size={24} />
						</div>
						<p className='text-base font-bold text-emerald-800'>Your work appears safe</p>
						<p className='text-sm text-emerald-600/80 mt-1'>We didn't find any unauthorized uses on our watched platforms.</p>
					</div>
				) : (
					<div className='space-y-3'>
						{violations.slice(0, 3).map((violation) => (
							<div key={violation._id} className='flex flex-col sm:flex-row gap-4 rounded-xl border border-red-200 bg-red-50/30 p-4 transition-all hover:bg-red-50/50'>
								<div className='h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-black'>
									{violation.assetId?.thumbnailUrl ? (
										<img src={violation.assetId.thumbnailUrl} alt='Asset' className='h-full w-full object-cover opacity-80' />
									) : (
										<div className='flex h-full items-center justify-center'><Camera size={20} className='text-white/30' /></div>
									)}
								</div>
								<div className='flex-1 flex flex-col justify-center min-w-0'>
									<div className='flex items-center gap-2 mb-1'>
										<Badge variant='danger' size='xs' className='uppercase tracking-widest'>Unauthorized Use</Badge>
										<span className='text-xs font-semibold text-slate-600 capitalize px-2 py-0.5 rounded bg-white border border-slate-200'>{violation.platform}</span>
									</div>
									<p className='text-sm font-bold text-(--app-color-text) truncate'>{violation.assetId?.title || 'Unknown Work'}</p>
									<p className='text-xs text-(--app-color-text-muted) mt-1 flex items-center gap-1.5'>
										<Zap size={10} className='text-amber-500' />
										Similarity: {Math.round(violation.confidenceScore * 100)}%
									</p>
								</div>
								<div className='flex items-center shrink-0'>
									<Button onClick={() => handleOpenDMCA(violation)} variant='primary' size='sm' className='w-full sm:w-auto shadow-sm whitespace-nowrap bg-red-600 hover:bg-red-700 text-white border-none'>
										Get Help Removing It
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

            {/* DMCA Guide Modal */}
            <Modal isOpen={isDMCAModalOpen} onClose={() => setIsDMCAModalOpen(false)} title="Remove Unauthorized Use">
                <div className='space-y-6'>
                    <div className='bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800'>
                        <Info size={18} className='shrink-0 mt-0.5' />
                        <p>As the original creator, you have the right to issue a DMCA takedown notice. Follow these 3 steps to get the content removed.</p>
                    </div>

                    <div className='space-y-4'>
                        <div className='flex gap-4'>
                            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-black'>1</div>
                            <div>
                                <h4 className='font-bold text-(--app-color-text) mb-1'>Download Evidence</h4>
                                <p className='text-xs text-(--app-color-text-muted) mb-3'>Save the AI match report to attach to your claim.</p>
                                <Button size='sm' variant='outline' className='flex items-center gap-2 text-xs'>
                                    <Download size={14} /> Download PDF Report
                                </Button>
                            </div>
                        </div>
                        
                        <div className='flex gap-4'>
                            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-black'>2</div>
                            <div>
                                <h4 className='font-bold text-(--app-color-text) mb-1'>Go to Platform Portal</h4>
                                <p className='text-xs text-(--app-color-text-muted) mb-3'>Open the official copyright claim form for {selectedViolation?.platform || 'this platform'}.</p>
                                <Button size='sm' variant='outline' className='flex items-center gap-2 text-xs'>
                                    <ExternalLink size={14} /> Open Copyright Portal
                                </Button>
                            </div>
                        </div>

                        <div className='flex gap-4'>
                            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-black'>3</div>
                            <div className='w-full'>
                                <h4 className='font-bold text-(--app-color-text) mb-1'>Copy Notice Template</h4>
                                <p className='text-xs text-(--app-color-text-muted) mb-3'>Paste this into the description field.</p>
                                <div className='bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-600 whitespace-pre-wrap'>
{`I am the copyright owner of the original work "${selectedViolation?.assetId?.title || 'Unknown Work'}". 
An unauthorized copy was detected on your platform on ${new Date(selectedViolation?.detectedAt || Date.now()).toLocaleDateString()}. 
I have a good faith belief that this use is not authorized by the copyright owner, its agent, or the law. 
Please remove this content immediately under the DMCA.`}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='flex justify-end border-t border-(--app-color-border) pt-4 mt-6'>
                        <Button onClick={() => setIsDMCAModalOpen(false)}>Done</Button>
                    </div>
                </div>
            </Modal>
		</div>
	);
}
