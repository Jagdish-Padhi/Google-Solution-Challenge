/**
 * Tabs Component
 * Tabbed interface for organizing content
 */

import { useState } from 'react';

const Tabs = ({
	tabs = [],
	defaultTab = 0,
	onChange = null,
	className = '',
}) => {
	const [activeTab, setActiveTab] = useState(defaultTab);

	const handleTabChange = (index) => {
		setActiveTab(index);
		onChange?.(index);
	};

	return (
		<div className={className}>
			{/* Tab Headers */}
			<div className='flex border-b border-[var(--app-color-border)] overflow-x-auto'>
				{tabs.map((tab, index) => (
					<button
						key={index}
						onClick={() => handleTabChange(index)}
						className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
							activeTab === index
								? 'text-[var(--app-color-primary)] border-[var(--app-color-primary)]'
								: 'text-[var(--app-color-text-muted)] border-transparent hover:text-[var(--app-color-text)]'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className='py-6'>
				{tabs[activeTab]?.content}
			</div>
		</div>
	);
};

export default Tabs;
