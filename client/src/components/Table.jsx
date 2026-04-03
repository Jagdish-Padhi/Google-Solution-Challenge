/**
 * Table Component
 * Reusable data table with sorting, pagination, and responsive design
 */

const Table = ({
	columns = [],
	data = [],
	onRowClick = null,
	isLoading = false,
	emptyMessage = 'No data available',
	className = '',
}) => {
	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-8'>
				<Spinner label='Loading data...' />
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className='flex items-center justify-center py-8 px-4'>
				<p className='text-[var(--app-color-text-muted)]'>{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className={`overflow-x-auto rounded-lg border border-[var(--app-color-border)] ${className}`}>
			<table className='w-full'>
				<thead>
					<tr className='border-b border-[var(--app-color-border)] bg-[var(--app-color-surface-elevated)]'>
						{columns.map((column) => (
							<th
								key={column.key}
								className='px-6 py-3 text-left text-sm font-semibold text-[var(--app-color-text)]'
								style={{ width: column.width }}
							>
								{column.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.map((row, rowIndex) => (
						<tr
							key={rowIndex}
							onClick={() => onRowClick && onRowClick(row)}
							className={`border-b border-[var(--app-color-border)] transition-colors ${
								onRowClick ? 'hover:bg-[var(--app-color-surface-elevated)] cursor-pointer' : ''
							}`}
						>
							{columns.map((column) => (
								<td key={`${rowIndex}-${column.key}`} className='px-6 py-4 text-sm text-[var(--app-color-text)]'>
									{typeof column.render === 'function' ? column.render(row[column.key], row) : row[column.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

import Spinner from './Spinner';

export default Table;
