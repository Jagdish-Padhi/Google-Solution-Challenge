import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, ExternalLink, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const tickAnimationStyles = `
@keyframes checkmark {
  0% { stroke-dashoffset: 48; }
  100% { stroke-dashoffset: 0; }
}
@keyframes checkmark-circle {
  0% { stroke-dashoffset: 151; }
  100% { stroke-dashoffset: 0; }
}
.animate-checkmark {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkmark 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  animation-delay: 0.1s;
}
.animate-checkmark-circle {
  stroke-dasharray: 151;
  stroke-dashoffset: 151;
  animation: checkmark-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}
`;

export default function ReportGenerationModal({ isGenerating, progress, report, onClose, onBackground, onDownload }) {
	if (!isGenerating && !report) return null;

	const reportUrl = report?.fileUrl?.startsWith('http') ? report.fileUrl : null;

	const handleView = () => {
		if (reportUrl) window.open(reportUrl, '_blank', 'noopener,noreferrer');
		else toast.error('Report URL not available.');
	};

	const handleShare = (platform) => {
		const text = encodeURIComponent(`SportShield Violation Intelligence Report: ${report.title}`);
		const url = encodeURIComponent(reportUrl || window.location.href);
		const links = {
			mail: `mailto:?subject=${text}&body=${text}%0A${url}`,
			whatsapp: `https://wa.me/?text=${text}%20${url}`,
			twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
			linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
		};
		window.open(links[platform], '_blank', 'noopener,noreferrer');
	};

	useEffect(() => {
		const originalStyle = window.getComputedStyle(document.body).overflow;
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = originalStyle; };
	}, []);

	const modalContent = (
		<div className='fixed inset-0 z-[99999] flex items-center justify-center' style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)' }}>
			<style>{tickAnimationStyles}</style>
			<div className='relative w-full max-w-md bg-white rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 mx-4'>
				{!report && (
					<div className='h-1.5 w-full bg-slate-100'>
						<div 
							className='h-full bg-teal-500 transition-all duration-700'
							style={{ width: `${progress}%` }} 
						/>
					</div>
				)}

				<div className={`${report ? 'p-8' : 'p-10'} flex flex-col items-center text-center`}>
					{!report ? (
						// ── GENERATING STATE ──
						<>
							<div className='relative w-24 h-24 mb-6'>
								<svg className='w-full h-full transform -rotate-90'>
									<circle cx='48' cy='48' r='42' fill='transparent' stroke='currentColor' strokeWidth='6' className='text-slate-100' />
									<circle 
										cx='48' cy='48' r='42' fill='transparent' stroke='currentColor' strokeWidth='6' 
										strokeDasharray='263.89' 
										strokeDashoffset={263.89 - (263.89 * progress) / 100}
										className='text-teal-500 transition-all duration-500 ease-out'
										strokeLinecap='round'
									/>
								</svg>
								<div className='absolute inset-0 flex items-center justify-center'>
									<span className='text-xl font-black text-slate-800'>{progress}%</span>
								</div>
							</div>
							
							<h2 className='text-xl font-black text-slate-900 mb-2'>Generating Report</h2>
							<p className='text-sm text-slate-500 leading-relaxed mb-6'>AI forensic engines are compiling your board-ready PDF summary...</p>
							
							<button 
								onClick={onBackground || onClose}
								className='px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all active:scale-95 border border-slate-200'
							>
								Continue in Background
							</button>
						</>
					) : (
						// ── COMPLETED STATE ──
						<>
							<div className='mb-6'>
								<div className='w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center relative'>
									<svg className='w-10 h-10 text-emerald-500' viewBox='0 0 52 52'>
										<circle className='animate-checkmark-circle' cx='26' cy='26' r='25' fill='none' stroke='currentColor' strokeWidth='4' />
										<path className='animate-checkmark' fill='none' stroke='currentColor' strokeWidth='4' strokeLinecap='round' d='M14.1 27.2l7.1 7.2 16.7-16.8' />
									</svg>
								</div>
							</div>

							<h2 className='text-2xl font-black text-slate-900 mb-1'>Report generated!</h2>
							<p className='text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest'>{report.rangeLabel} &middot; {new Date(report.generatedAt).toLocaleDateString()}</p>

							{/* Summary Grid */}
							<div className='grid grid-cols-3 gap-2 w-full mb-6'>
								{[
									{ label: 'Violations', val: report.stats?.totalViolations ?? 0, color: 'text-red-600' },
									{ label: 'Enforced', val: report.stats?.resolvedViolations ?? 0, color: 'text-emerald-600' },
									{ label: 'Accuracy', val: `${report.stats?.avgConfidenceScore ?? 0}%`, color: 'text-indigo-600' }
								].map(s => (
									<div key={s.label} className='bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center'>
										<p className='text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5'>{s.label}</p>
										<p className={`text-base font-black ${s.color}`}>{s.val}</p>
									</div>
								))}
							</div>

							{/* Actions */}
							<div className='flex gap-2 w-full mb-6'>
								<button
									onClick={handleView}
									className='flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-teal-600/20'
								>
									<ExternalLink size={16} /> View
								</button>
								<button
									onClick={() => onDownload(report)}
									className='flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all active:scale-95'
								>
									<Download size={16} /> Download
								</button>
							</div>

							{/* Secure Share */}
							<div className='w-full border-t border-slate-100 pt-6'>
								<p className='text-[9px] uppercase font-black text-slate-400 tracking-[0.2em] mb-4 text-center'>Distribute Securely</p>
								<div className='flex justify-center gap-3'>
									{[
										{ id: 'mail', label: 'Mail', icon: Mail },
										{ id: 'whatsapp', label: 'WA', icon: () => '💬' },
										{ id: 'twitter', label: 'X', icon: () => '𝕏' },
										{ id: 'linkedin', label: 'LI', icon: () => 'in' }
									].map(p => (
										<button 
											key={p.id} 
											onClick={() => handleShare(p.id)} 
											className='flex flex-col items-center gap-1.5 transition-all group'
										>
											<div className='w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-teal-50 group-hover:border-teal-200 transition-colors'>
												{typeof p.icon === 'function' ? <span className='text-sm font-black'>{p.icon()}</span> : <p.icon size={16} className='text-slate-600 group-hover:text-teal-600' />}
											</div>
											<span className='text-[9px] font-bold text-slate-500 group-hover:text-teal-600 uppercase'>{p.label}</span>
										</button>
									))}
								</div>
							</div>
						</>
					)}
				</div>

				{report && (
					<button onClick={onClose} className='absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 text-sm transition-all'>✕</button>
				)}
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
