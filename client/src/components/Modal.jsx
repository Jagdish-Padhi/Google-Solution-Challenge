import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({
	isOpen = false,
	onClose,
	title = '',
	children,
	footer = null,
	size = 'md',
	closeOnBackdropClick = true,
	className = '',
}) => {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl',
		'3xl': 'max-w-3xl',
		'4xl': 'max-w-4xl',
		'5xl': 'max-w-5xl',
	};

	const modalContent = (
		<div className='fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden'>
			{/* Backdrop with Blur */}
			<div
				className='fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300'
				onClick={() => closeOnBackdropClick && onClose()}
			/>

			{/* Modal Content - Anchored to Center-Point */}
			<div 
				className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl flex flex-col w-[95%] sm:w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 will-change-transform ${sizeClasses[size] || sizeClasses.md} ${className}`}
			>
				{/* Header */}
				<div className='flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 flex-shrink-0 bg-white z-10'>
					<h2 className='text-lg font-bold text-slate-900 tracking-tight'>{title}</h2>
					<button
						onClick={onClose}
						className='p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all'
						aria-label='Close modal'
					>
						<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
						</svg>
					</button>
				</div>

				{/* Body - Scrollable */}
				<div className='flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-slate-200'>
					{children}
				</div>

				{/* Footer */}
				{footer && (
					<div className='border-t border-slate-100 px-6 py-4 bg-slate-50 flex gap-3 justify-end flex-shrink-0'>
						{footer}
					</div>
				)}
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};

export default Modal;
