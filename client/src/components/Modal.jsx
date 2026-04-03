/**
 * Modal Component
 * Overlay dialog for focused user interactions
 */

import { useEffect } from 'react';

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
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center'>
			{/* Backdrop */}
			<div
				className='absolute inset-0 bg-black/50 transition-opacity'
				onClick={() => closeOnBackdropClick && onClose()}
			/>

			{/* Modal Content */}
			<div className={`relative bg-[var(--app-color-surface)] rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${sizeClasses[size] || sizeClasses.md} ${className}`}>
				{/* Header */}
				<div className='flex items-center justify-between gap-4 border-b border-[var(--app-color-border)] px-6 py-4'>
					<h2 className='text-lg font-semibold text-[var(--app-color-text)]'>{title}</h2>
					<button
						onClick={onClose}
						className='text-[var(--app-color-text-muted)] hover:text-[var(--app-color-text)] transition-colors'
						aria-label='Close modal'
					>
						<svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
							<path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd' />
						</svg>
					</button>
				</div>

				{/* Body */}
				<div className='px-6 py-4'>{children}</div>

				{/* Footer */}
				{footer && <div className='border-t border-[var(--app-color-border)] px-6 py-4 bg-[var(--app-color-surface-elevated)] flex gap-3 justify-end'>{footer}</div>}
			</div>
		</div>
	);
};

export default Modal;
