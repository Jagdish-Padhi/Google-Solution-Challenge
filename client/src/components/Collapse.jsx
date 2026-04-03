/**
 * Collapse / Accordion Component
 * Expandable content sections
 */

import { useState } from 'react';

const Collapse = ({
	items = [],
	allowMultiple = false,
	className = '',
}) => {
	const [expanded, setExpanded] = useState([]);

	const toggleItem = (id) => {
		if (allowMultiple) {
			setExpanded((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
		} else {
			setExpanded((prev) => (prev.includes(id) ? [] : [id]));
		}
	};

	return (
		<div className={`border border-[var(--app-color-border)] rounded-lg overflow-hidden ${className}`}>
			{items.map((item, index) => (
				<div key={item.id || index} className={index > 0 ? 'border-t border-[var(--app-color-border)]' : ''}>
					<button
						onClick={() => toggleItem(item.id || index)}
						className='w-full flex items-center justify-between gap-4 px-6 py-4 bg-[var(--app-color-surface)] hover:bg-[var(--app-color-surface-elevated)] transition-colors text-left'
					>
						<h4 className='font-semibold text-[var(--app-color-text)]'>{item.title}</h4>
						<svg
							className={`w-5 h-5 text-[var(--app-color-text-muted)] transition-transform ${
								expanded.includes(item.id || index) ? 'rotate-180' : ''
							}`}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' />
						</svg>
					</button>

					{expanded.includes(item.id || index) && (
						<div className='px-6 py-4 border-t border-[var(--app-color-border)] bg-[var(--app-color-surface-elevated)]'>
							{item.content}
						</div>
					)}
				</div>
			))}
		</div>
	);
};

export default Collapse;
