import { useCallback, useEffect, useState } from 'react';
import { Camera, CheckCircle2, Download, ExternalLink, ShieldAlert, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge, Button, Card, Modal, Spinner, Loader } from '../../components';
import api from '../../services/api.js';

const PORTAL_URLS = {
	youtube: 'https://support.google.com/youtube/answer/2807622',
	twitter: 'https://help.twitter.com/forms/dmca',
	telegram: 'https://telegram.org/dmca',
	web: 'https://www.lumendatabase.org/',
};

const PLATFORM_INSTRUCTIONS = {
	youtube: 'Use YouTube\'s Copyright Removal form at the link below. Attach your downloaded evidence ZIP when prompted.',
	twitter: 'Use Twitter\'s DMCA webform linked below. Paste your notice into the description field.',
	telegram: 'Email dmca@telegram.org directly with your evidence package attached.',
	web: 'Submit via the Lumen Database or contact the hosting domain\'s abuse team directly.',
};

export default function CreatorFindingsPage() {
	const [violations, setViolations] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const [isDMCAModalOpen, setIsDMCAModalOpen] = useState(false);
	const [selectedViolation, setSelectedViolation] = useState(null);
	const [dmcaStep, setDmcaStep] = useState(1);
	const [dmcaText, setDmcaText] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);

	const loadFindings = useCallback(async () => {
		try {
			const response = await api.get('/violations?page=1&limit=50');
			setViolations(response.data.items || []);
		} catch {
			toast.error('Unable to load findings.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		document.title = 'Theft Findings — SportShield Creator';
		loadFindings();
	}, [loadFindings]);

	const handleUpdateStatus = async (violationId, newStatus) => {
		try {
			await api.patch(`/violations/${violationId}/status`, { status: newStatus });
			setViolations((prev) =>
				prev.map((v) => (v._id === violationId ? { ...v, status: newStatus } : v))
			);
			if (newStatus === 'resolved') toast.success('Marked as removed ✓');
			else if (newStatus === 'reported') toast.success('Marked as reported to platform.');
		} catch {
			toast.error('Unable to update status.');
		}
	};

	const handleOpenDMCA = async (violation) => {
		setSelectedViolation(violation);
		setDmcaStep(1);
		setDmcaText('');
		setIsGenerating(true);
		setIsDMCAModalOpen(true);

		try {
			const res = await api.post(`/violations/${violation._id}/draft-dmca`);
			setDmcaText(res.data.draft || '');
		} catch {
			setDmcaText('Unable to generate a DMCA notice right now. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	const handleCloseModal = () => {
		setIsDMCAModalOpen(false);
		setSelectedViolation(null);
		setDmcaStep(1);
		setDmcaText('');
	};

	const handleDownloadEvidence = () => {
		const content = dmcaText || `DMCA Evidence\nAsset: ${selectedViolation?.assetId?.title}\nURL: ${selectedViolation?.sourceUrl}\nConfidence: ${selectedViolation?.matchConfidence}%\nDetected: ${new Date(selectedViolation?.detectedAt).toUTCString()}`;
		const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${(selectedViolation?.assetId?.title || 'evidence').replace(/\s+/g, '-').toLowerCase()}-dmca.txt`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleCopyDMCA = async () => {
		try {
			await navigator.clipboard.writeText(dmcaText);
			toast.success('DMCA notice copied to clipboard.');
		} catch {
			toast.error('Unable to copy DMCA notice.');
		}
	};

	const handleMarkReported = async () => {
		await handleUpdateStatus(selectedViolation._id, 'reported');
		handleCloseModal();
	};

	const openCount = violations.filter((v) => v.status === 'open').length;
	const reportedCount = violations.filter((v) => v.status === 'reported').length;
	const resolvedCount = violations.filter((v) => v.status === 'resolved').length;

	if (isLoading) {
		return (
			<div className='flex h-full flex-col items-center justify-center py-24 gap-6 text-sm text-(--app-color-text-muted)'>
				<Loader size={0.7} />
				<p className='font-bold uppercase tracking-widest animate-pulse'>Loading Findings...</p>
			</div>
		);
	}

	return (
		<div className='mx-auto max-w-4xl p-6 lg:p-10 space-y-8'>
			<div>
				<h1 className='text-3xl font-black text-(--app-color-text) tracking-tight mb-2 flex items-center gap-3'>
					<ShieldAlert className='text-(--app-color-primary)' /> Theft Findings
				</h1>
				<p className='text-base text-(--app-color-text-muted)'>
					Review unauthorized uses of your work and take action to protect your copyright.
				</p>
			</div>

			{violations.length > 0 && (
				<div className='flex flex-wrap gap-3 rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-panel) p-4 text-sm'>
					<span className='font-bold text-red-600'>{openCount} action needed</span>
					<span className='text-(--app-color-text-muted)'>·</span>
					<span className='font-semibold text-amber-600'>{reportedCount} reported</span>
					<span className='text-(--app-color-text-muted)'>·</span>
					<span className='font-semibold text-emerald-600'>{resolvedCount} removed</span>
				</div>
			)}

			{violations.length === 0 ? (
				<div className='rounded-2xl border border-emerald-100 bg-emerald-50 p-12 text-center'>
					<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
						<CheckCircle2 size={32} />
					</div>
					<h2 className='text-xl font-bold text-emerald-800 mb-2'>Great news — no unauthorized uses found yet</h2>
					<p className='text-sm text-emerald-600/80'>Your portfolio appears to be safe on our watched platforms.</p>
				</div>
			) : (
				<div className='space-y-4'>
					{violations.map((violation) => {
						const isResolved = violation.status === 'resolved';
						return (
							<Card
								key={violation._id}
								className={`overflow-hidden border shadow-sm transition-all ${isResolved ? 'border-l-4 border-l-emerald-400 border-(--app-color-border)' : 'border-l-4 border-l-red-400 border-(--app-color-border)'}`}
							>
								<div className='flex flex-col sm:flex-row gap-6 p-5'>
									<div className='h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-black border border-slate-200'>
										{violation.assetId?.thumbnailUrl ? (
											<img src={violation.assetId.thumbnailUrl} alt='Asset' className='h-full w-full object-cover opacity-90' />
										) : (
											<div className='flex h-full items-center justify-center'><Camera size={24} className='text-white/40' /></div>
										)}
									</div>

									<div className='flex-1 flex flex-col justify-center min-w-0'>
										<div className='flex items-center gap-2 mb-2'>
											{isResolved ? (
												<Badge variant='success' size='xs' className='uppercase tracking-widest'>✓ Removed</Badge>
											) : (
												<Badge variant='danger' size='xs' className='uppercase tracking-widest'>Active Theft</Badge>
											)}
											<span className='text-xs font-semibold text-slate-600 capitalize px-2 py-0.5 rounded bg-slate-100 border border-slate-200'>
												{violation.platform}
											</span>
										</div>

										<h3 className='text-lg font-bold text-(--app-color-text) truncate mb-1'>
											{violation.assetId?.title || 'Unknown Work'}
										</h3>

										<div className='flex flex-wrap gap-x-6 gap-y-2 mt-2'>
											<p className='text-xs font-semibold flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100'>
												<Zap size={12} />
												Similarity: {violation.matchConfidence ?? 0}%
											</p>
											<p className='text-xs text-(--app-color-text-muted) flex items-center gap-1.5'>
												<span className='font-bold uppercase tracking-widest text-[10px]'>Found On</span>
												{new Date(violation.detectedAt).toLocaleDateString([], { dateStyle: 'medium' })}
											</p>
										</div>

										<div className='mt-3'>
											<select
												value={violation.status}
												onChange={(e) => handleUpdateStatus(violation._id, e.target.value)}
												className='text-xs border border-(--app-color-border) rounded-lg px-2 py-1.5 bg-white text-(--app-color-text) focus:outline-none focus:ring-1 focus:ring-(--app-color-primary)'
											>
												<option value='open'>Action Needed</option>
												<option value='reported'>Reported to Platform</option>
												<option value='resolved'>Removed ✓</option>
											</select>
										</div>
									</div>

									<div className='flex items-center shrink-0 border-t sm:border-t-0 sm:border-l border-(--app-color-border)/60 pt-4 sm:pt-0 sm:pl-6 mt-4 sm:mt-0'>
										{!isResolved ? (
											<Button
												onClick={() => handleOpenDMCA(violation)}
												variant='primary'
												className='w-full sm:w-auto shadow-sm whitespace-nowrap bg-red-600 hover:bg-red-700 text-white border-none h-10'
											>
												Start Removal
											</Button>
										) : (
											<span className='text-sm font-bold text-emerald-600 flex items-center gap-2'>
												<CheckCircle2 size={16} /> Resolved
											</span>
										)}
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			)}

			<Modal isOpen={isDMCAModalOpen} onClose={handleCloseModal} title='Remove Unauthorized Use'>
				<div className='space-y-5'>
					<div className='flex items-center gap-2'>
						{[1, 2, 3].map((s) => (
							<div key={s} className='flex items-center gap-2'>
								<div
									className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${
										dmcaStep === s
											? 'bg-(--app-color-primary) text-white'
											: dmcaStep > s
											? 'bg-emerald-500 text-white'
											: 'bg-slate-100 text-slate-400'
									}`}
								>
									{dmcaStep > s ? <CheckCircle2 size={14} /> : s}
								</div>
								{s < 3 && <div className={`h-px w-8 ${dmcaStep > s ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
							</div>
						))}
						<p className='ml-2 text-xs font-semibold text-(--app-color-text-muted)'>Step {dmcaStep} of 3</p>
					</div>

					{dmcaStep === 1 && (
						<div className='space-y-4'>
							<div>
								<h3 className='text-lg font-black text-(--app-color-text)'>Your Evidence is Ready</h3>
								<p className='text-sm text-(--app-color-text-muted) mt-1'>Review your case details and download the evidence package.</p>
							</div>

							<div className='rounded-xl border border-(--app-color-border) bg-slate-50 p-4 space-y-2 text-sm'>
								<div className='flex justify-between'>
									<span className='text-(--app-color-text-muted) font-semibold'>Asset</span>
									<span className='font-bold text-(--app-color-text)'>{selectedViolation?.assetId?.title || 'Unknown Work'}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-(--app-color-text-muted) font-semibold'>Platform</span>
									<span className='font-bold capitalize text-(--app-color-text)'>{selectedViolation?.platform}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-(--app-color-text-muted) font-semibold'>Detected</span>
									<span className='font-bold text-(--app-color-text)'>{new Date(selectedViolation?.detectedAt).toLocaleDateString([], { dateStyle: 'medium' })}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-(--app-color-text-muted) font-semibold'>Similarity</span>
									<span className='font-bold text-amber-600'>{selectedViolation?.matchConfidence ?? 0}%</span>
								</div>
								{selectedViolation?.evidenceBundle?.orbVerified && (
									<div className='flex justify-between'>
										<span className='text-(--app-color-text-muted) font-semibold'>Verification</span>
										<span className='font-bold text-emerald-600'>ORB Verified ✓</span>
									</div>
								)}
							</div>

							<Button
								variant='outline'
								onClick={handleDownloadEvidence}
								className='flex items-center gap-2 w-full justify-center'
							>
								<Download size={15} /> Download Evidence Package
							</Button>

							<div className='flex justify-end pt-2'>
								<Button onClick={() => setDmcaStep(2)}>Next: File Your Claim →</Button>
							</div>
						</div>
					)}

					{dmcaStep === 2 && (
						<div className='space-y-4'>
							<div>
								<h3 className='text-lg font-black text-(--app-color-text)'>File Your Claim</h3>
								<p className='text-sm text-(--app-color-text-muted) mt-1'>Follow the platform-specific steps below.</p>
							</div>

							<div className='rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800'>
								{PLATFORM_INSTRUCTIONS[selectedViolation?.platform] || PLATFORM_INSTRUCTIONS.web}
							</div>

							<Button
								onClick={() => window.open(PORTAL_URLS[selectedViolation?.platform] || PORTAL_URLS.web, '_blank', 'noopener,noreferrer')}
								variant='outline'
								className='flex items-center gap-2 w-full justify-center capitalize'
							>
								<ExternalLink size={15} /> Open {selectedViolation?.platform || 'Platform'} Copyright Portal
							</Button>

							<div className='flex justify-between pt-2'>
								<Button variant='outline' onClick={() => setDmcaStep(1)}>← Back</Button>
								<Button onClick={() => setDmcaStep(3)}>Next: Copy Your Notice →</Button>
							</div>
						</div>
					)}

					{dmcaStep === 3 && (
						<div className='space-y-4'>
							<div>
								<h3 className='text-lg font-black text-(--app-color-text)'>Copy Your Notice</h3>
								<p className='text-sm text-(--app-color-text-muted) mt-1'>Paste this into the claim form's description field.</p>
							</div>

							{isGenerating ? (
								<div className='flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600'>
									<Spinner size='sm' />
									Generating your DMCA notice...
								</div>
							) : (
								<pre className='max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-700 whitespace-pre-wrap'>
									{dmcaText}
								</pre>
							)}

							<div className='flex flex-wrap gap-2'>
								<Button variant='outline' size='sm' onClick={handleCopyDMCA} disabled={isGenerating}>
									Copy Notice
								</Button>
								<a
									href={`mailto:?subject=DMCA%20Takedown%20Request%20for%20${encodeURIComponent(selectedViolation?.assetId?.title || 'Work')}&body=${encodeURIComponent(dmcaText || '')}`}
									className='inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
								>
									Send via Email
								</a>
							</div>

							<div className='flex justify-between pt-2 border-t border-(--app-color-border)'>
								<Button variant='outline' onClick={() => setDmcaStep(2)}>← Back</Button>
								<Button
									onClick={handleMarkReported}
									className='bg-emerald-600 hover:bg-emerald-700 text-white border-none'
								>
									Mark as Reported ✓
								</Button>
							</div>
						</div>
					)}
				</div>
			</Modal>
		</div>
	);
}