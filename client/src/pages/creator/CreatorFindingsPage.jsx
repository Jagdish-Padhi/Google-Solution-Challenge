import { useCallback, useEffect, useState } from 'react';
import { Camera, CheckCircle2, Download, ExternalLink, Info, ShieldAlert, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge, Button, Card, Modal, Spinner, Loader } from '../../components';
import api from '../../services/api.js';

export default function CreatorFindingsPage() {
	const [violations, setViolations] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	// DMCA Modal State
	const [isDMCAModalOpen, setIsDMCAModalOpen] = useState(false);
	const [selectedViolation, setSelectedViolation] = useState(null);

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
		loadFindings();
	}, [loadFindings]);

	const handleOpenDMCA = (violation) => {
		setSelectedViolation(violation);
		setIsDMCAModalOpen(true);
	};

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
					{violations.map((violation) => (
						<Card key={violation._id} className='overflow-hidden border border-(--app-color-border) shadow-sm'>
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
										<Badge variant={violation.status === 'open' ? 'danger' : 'success'} size='xs' className='uppercase tracking-widest'>
											{violation.status === 'open' ? 'Active Theft' : 'Resolved'}
										</Badge>
										<span className='text-xs font-semibold text-slate-600 capitalize px-2 py-0.5 rounded bg-slate-100 border border-slate-200'>
											{violation.platform}
										</span>
									</div>
									
									<h3 className='text-lg font-bold text-(--app-color-text) truncate mb-1'>
										{violation.assetId?.title || 'Unknown Work'}
									</h3>
									
									<div className='flex flex-wrap gap-x-6 gap-y-2 mt-2'>
										<p className='text-xs font-semibold text-slate-600 flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100'>
											<Zap size={12} />
											Similarity: {Math.round(violation.confidenceScore * 100)}%
										</p>
										<p className='text-xs text-(--app-color-text-muted) flex items-center gap-1.5'>
											<span className='font-bold uppercase tracking-widest text-[10px]'>Found On</span> 
											{new Date(violation.detectedAt).toLocaleDateString([], { dateStyle: 'medium' })}
										</p>
									</div>
								</div>
								
								<div className='flex items-center shrink-0 border-t sm:border-t-0 sm:border-l border-(--app-color-border)/60 pt-4 sm:pt-0 sm:pl-6 mt-4 sm:mt-0'>
									<Button 
										onClick={() => handleOpenDMCA(violation)} 
										variant='primary' 
										className='w-full sm:w-auto shadow-sm whitespace-nowrap bg-red-600 hover:bg-red-700 text-white border-none h-10'
									>
										Start Removal
									</Button>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}

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
								<div className='bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-600 whitespace-pre-wrap select-all cursor-text'>
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
