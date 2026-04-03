/**
 * Pagination Component
 * Navigate through paginated data
 */

const Pagination = ({
	currentPage = 1,
	totalPages = 1,
	onPageChange,
	hasNextPage = true,
	hasPreviousPage = false,
	className = '',
}) => {
	return (
		<div className={`flex items-center justify-center gap-2 ${className}`}>
			<button
				onClick={() => onPageChange(currentPage - 1)}
				disabled={!hasPreviousPage}
				className='px-4 py-2 rounded-lg border border-[var(--app-color-border)] text-[var(--app-color-text)] hover:bg-[var(--app-color-surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
			>
				Previous
			</button>

			<div className='flex items-center gap-2'>
				<span className='text-sm text-[var(--app-color-text-muted)]'>
					Page <span className='font-semibold'>{currentPage}</span> of <span className='font-semibold'>{totalPages}</span>
				</span>
			</div>

			<button
				onClick={() => onPageChange(currentPage + 1)}
				disabled={!hasNextPage}
				className='px-4 py-2 rounded-lg border border-[var(--app-color-border)] text-[var(--app-color-text)] hover:bg-[var(--app-color-surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
			>
				Next
			</button>
		</div>
	);
};

export default Pagination;
