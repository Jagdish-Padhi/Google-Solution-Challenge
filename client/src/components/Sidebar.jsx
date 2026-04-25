/**
 * Sidebar Component
 * Collapsible navigation sidebar with menu items
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({
	items = [],
	activeItem = null,
	onItemClick = null,
	collapsible = true,
	className = '',
}) => {
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<aside
			className={`bg-[var(--app-color-surface)] border-r border-[var(--app-color-border)] transition-all duration-300 ${
				isCollapsed ? 'w-20' : 'w-64'
			} flex flex-col h-screen sticky top-0 ${className}`}
		>
			{/* Logo Section */}
			<Link to='/' className={`flex items-center gap-3 p-6 hover:opacity-80 transition-opacity ${isCollapsed ? 'justify-center p-4' : ''}`}>
				<img src='/logo.png' alt='Logo' className='h-10 w-10 object-contain' />
				{!isCollapsed && (
					<span className='text-sm font-bold uppercase tracking-[0.2em] text-[var(--app-color-text)]'>
						SportShield
					</span>
				)}
			</Link>

			{/* Toggle Button Area */}
			{collapsible && (
				<div className='flex items-center justify-end px-4 py-2'>
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className='p-1.5 hover:bg-[var(--app-color-surface-elevated)] rounded-lg transition-colors border border-transparent hover:border-[var(--app-color-border)]'
						title={isCollapsed ? 'Expand' : 'Collapse'}
					>
						<svg className='w-4 h-4 text-[var(--app-color-text-muted)]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
						</svg>
					</button>
				</div>
			)}

			{/* Menu Items */}
			<nav className='flex-1 overflow-y-auto px-4 py-6 space-y-2'>
				{items.map((item) => (
					<a
						key={item.id}
						href={item.href || '#'}
						onClick={(e) => {
							if (onItemClick) {
								e.preventDefault();
								onItemClick(item.id);
							}
						}}
						className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all ${
							activeItem === item.id
								? 'bg-[var(--app-color-primary-soft)] text-[var(--app-color-primary)] font-bold'
								: 'text-[var(--app-color-text)] hover:bg-[var(--app-color-surface-elevated)] font-medium'
						} ${isCollapsed ? 'justify-center' : ''}`}
						title={isCollapsed ? item.label : ''}
					>
						{item.icon && <span className='w-5 h-5 flex-shrink-0'>{item.icon}</span>}
						{!isCollapsed && <span className='flex-1 truncate'>{item.label}</span>}
					</a>
				))}
			</nav>

			{/* Footer */}
			{!isCollapsed && (
				<div className='border-t border-[var(--app-color-border)] p-4 text-xs text-[var(--app-color-text-muted)]'>
					<p>© 2026 SportShield</p>
				</div>
			)}
		</aside>
	);
};

export default Sidebar;
