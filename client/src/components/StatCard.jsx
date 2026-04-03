/**
 * StatCard Component
 * Display statistical data with optional icon and trend
 */

const StatCard = ({
	label,
	value,
	icon: Icon = null,
	trend = null,
	trendUp = true,
	trendLabel = '',
	subtitle = '',
	className = '',
}) => {
	return (
		<Card className={`bg-gradient-to-br from-[var(--app-color-surface)] to-[var(--app-color-surface-elevated)] ${className}`}>
			<div className='flex items-start justify-between'>
				<div className='flex-1'>
					<p className='text-sm font-medium text-[var(--app-color-text-muted)]'>{label}</p>
					<h3 className='text-3xl font-bold text-[var(--app-color-text)] mt-2'>{value}</h3>
					{subtitle && <p className='text-xs text-[var(--app-color-text-muted)] mt-1'>{subtitle}</p>}
				</div>
				{Icon && (
					<div className='flex-shrink-0 rounded-lg bg-[var(--app-color-primary-soft)] p-3'>
						<Icon className='w-6 h-6 text-[var(--app-color-primary)]' />
					</div>
				)}
			</div>
			{trend && (
				<div className={`flex items-center gap-1 mt-4 text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
					<span>{trendUp ? '↑' : '↓'}</span>
					<span>{trend}</span>
					{trendLabel && <span className='text-[var(--app-color-text-muted)] font-normal'>{trendLabel}</span>}
				</div>
			)}
		</Card>
	);
};

// Need to import Card at runtime
import Card from './Card';

export default StatCard;
