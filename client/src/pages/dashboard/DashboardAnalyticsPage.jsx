import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { Badge, Button, Card, EmptyState, Spinner } from '../../components';
import api from '../../services/api.js';

const rangeOptions = [
	{ value: '7d', label: 'Last 7 days' },
	{ value: '30d', label: 'Last 30 days' },
	{ value: '90d', label: 'Last 90 days' },
	{ value: 'custom', label: 'Custom range' },
];

function buildChartPoints(items) {
	if (!items.length) {
		return '';
	}

	const maxValue = Math.max(...items.map((item) => item.count), 1);

	return items
		.map((item, index) => {
			const x = items.length === 1 ? 210 : (index / (items.length - 1)) * 420;
			const y = 140 - (item.count / maxValue) * 120;
			return `${x},${y}`;
		})
		.join(' ');
}

function trendBadgeVariant(direction) {
	if (direction === 'up') {
		return 'warning';
	}

	if (direction === 'down') {
		return 'success';
	}

	return 'secondary';
}

function TrendLineChart({ items }) {
	if (!items.length) {
		return <EmptyState title='No timeline data' message='Run more scans to build trend visibility.' />;
	}

	const points = buildChartPoints(items);
	const maxValue = Math.max(...items.map((item) => item.count), 1);

	return (
		<div className='space-y-4'>
			<svg viewBox='0 0 440 160' className='h-44 w-full overflow-visible'>
				<defs>
					<linearGradient id='analytics-line' x1='0%' y1='0%' x2='100%' y2='0%'>
						<stop offset='0%' stopColor='#14b8a6' />
						<stop offset='100%' stopColor='#0f766e' />
					</linearGradient>
				</defs>
				<line x1='0' y1='140' x2='420' y2='140' stroke='rgba(148, 163, 184, 0.6)' strokeWidth='1' />
				<polyline
					fill='none'
					stroke='url(#analytics-line)'
					strokeWidth='4'
					strokeLinecap='round'
					strokeLinejoin='round'
					points={points}
				/>
				{items.map((item, index) => {
					const x = items.length === 1 ? 210 : (index / (items.length - 1)) * 420;
					const y = 140 - (item.count / maxValue) * 120;

					return (
						<g key={item.date}>
							<circle cx={x} cy={y} r='4' fill='#0f766e' />
						</g>
					);
				})}
			</svg>
			<div className='grid grid-cols-4 gap-2 text-xs text-(--app-color-text-muted) sm:grid-cols-7'>
				{items.slice(Math.max(0, items.length - 7)).map((item) => (
					<div key={item.date} className='rounded-lg bg-(--app-color-surface) px-2 py-2 text-center'>
						<p>{item.label}</p>
						<p className='mt-1 font-semibold text-(--app-color-text)'>{item.count}</p>
					</div>
				))}
			</div>
		</div>
	);
}

function PlatformBars({ items }) {
	if (!items.length) {
		return <EmptyState title='No platform mix yet' message='Violations will be grouped by source platform here.' />;
	}

	return (
		<div className='space-y-3'>
			{items.map((item) => (
				<div key={item.platform} className='space-y-1'>
					<div className='flex items-center justify-between text-sm'>
						<p className='font-medium capitalize text-(--app-color-text)'>{item.platform}</p>
						<p className='text-(--app-color-text-muted)'>
							{item.count} violations • {item.percentage}%
						</p>
					</div>
					<div className='h-3 overflow-hidden rounded-full bg-(--app-color-surface)'>
						<div
							className='h-full rounded-full bg-[linear-gradient(90deg,var(--app-color-primary),#0f766e)]'
							style={{ width: `${Math.max(8, item.percentage)}%` }}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

export default function DashboardAnalyticsPage() {
	const [range, setRange] = useState('30d');
	const [customDates, setCustomDates] = useState({
		startDate: '',
		endDate: '',
	});
	const [overview, setOverview] = useState(null);
	const [timeline, setTimeline] = useState([]);
	const [platforms, setPlatforms] = useState([]);
	const [reports, setReports] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);
	const [error, setError] = useState('');

	const queryParams = useMemo(() => {
		const params = { range };

		if (range === 'custom') {
			if (customDates.startDate) {
				params.startDate = customDates.startDate;
			}
			if (customDates.endDate) {
				params.endDate = customDates.endDate;
			}
		}

		return params;
	}, [customDates.endDate, customDates.startDate, range]);

	useEffect(() => {
		let isMounted = true;

		async function loadAnalytics() {
			if (range === 'custom' && (!customDates.startDate || !customDates.endDate)) {
				setIsLoading(false);
				setOverview(null);
				setTimeline([]);
				setPlatforms([]);
				return;
			}

			setIsLoading(true);
			setError('');

			try {
				const [overviewResponse, timelineResponse, platformsResponse, reportsResponse] = await Promise.all([
					api.get('/analytics/overview', { params: queryParams }),
					api.get('/analytics/timeline', { params: queryParams }),
					api.get('/analytics/platforms', { params: queryParams }),
					api.get('/reports', { params: { page: 1, limit: 5 } }),
				]);

				if (!isMounted) {
					return;
				}

				setOverview(overviewResponse.data);
				setTimeline(timelineResponse.data.items || []);
				setPlatforms(platformsResponse.data.items || []);
				setReports(reportsResponse.data.items || []);
			} catch {
				if (isMounted) {
					setError('Unable to load analytics right now.');
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		loadAnalytics();

		return () => {
			isMounted = false;
		};
	}, [customDates.endDate, customDates.startDate, queryParams, range]);

	const handleGenerateReport = async () => {
		if (range === 'custom' && (!customDates.startDate || !customDates.endDate)) {
			toast.error('Select both custom dates before generating a report.');
			return;
		}

		setIsGeneratingReport(true);

		try {
			const response = await api.post('/reports/generate', queryParams);
			const generatedReport = response.data?.report;
			toast.success('Report generated successfully.');

			if (generatedReport) {
				setReports((current) => [generatedReport, ...current].slice(0, 5));
			}
		} catch (requestError) {
			const message = requestError.response?.data?.message || 'Unable to generate report.';
			toast.error(message);
		} finally {
			setIsGeneratingReport(false);
		}
	};

	const statCards = overview
		? [
				{ label: 'Total violations', value: overview.totalViolations, subtitle: overview.rangeLabel },
				{ label: 'Resolved', value: overview.resolvedViolations, subtitle: `${Math.round((overview.resolutionRate || 0) * 100)}% resolution rate` },
				{ label: 'Avg confidence', value: `${overview.avgConfidenceScore}%`, subtitle: 'Across detected matches' },
				{ label: 'Assets monitored', value: overview.totalAssets, subtitle: `${overview.openViolations} currently open` },
			]
		: [];

	return (
		<div className='space-y-6'>
			<div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
				<div>
					<h2 className='text-2xl font-semibold text-(--app-color-text)'>Analytics and reports</h2>
					<p className='text-sm text-(--app-color-text-muted)'>
						Track violation trends, platform spread, repeat offenders, and export board-ready summaries.
					</p>
				</div>

				<div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
					<div>
						<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Range</label>
						<select
							value={range}
							onChange={(event) => setRange(event.target.value)}
							className='w-full rounded-lg border border-(--app-color-border) bg-(--app-color-surface-panel) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
						>
							{rangeOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					{range === 'custom' ? (
						<>
							<div>
								<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>Start date</label>
								<input
									type='date'
									value={customDates.startDate}
									onChange={(event) => setCustomDates((current) => ({ ...current, startDate: event.target.value }))}
									className='rounded-lg border border-(--app-color-border) bg-(--app-color-surface-panel) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
								/>
							</div>
							<div>
								<label className='mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-(--app-color-text-muted)'>End date</label>
								<input
									type='date'
									value={customDates.endDate}
									onChange={(event) => setCustomDates((current) => ({ ...current, endDate: event.target.value }))}
									className='rounded-lg border border-(--app-color-border) bg-(--app-color-surface-panel) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none'
								/>
							</div>
						</>
					) : null}

					<Button onClick={handleGenerateReport} loading={isGeneratingReport} disabled={isGeneratingReport}>
						Generate report
					</Button>
				</div>
			</div>

			{overview?.trend ? (
				<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
						<div>
							<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>Trend signal</p>
							<p className='mt-1 text-lg font-semibold text-(--app-color-text)'>
								{overview.trend.currentWindowViolations} violations in {overview.rangeLabel}
							</p>
							<p className='mt-1 text-sm text-(--app-color-text-muted)'>
								Compared with {overview.trend.previousWindowViolations} in the previous equivalent window.
							</p>
						</div>
						<Badge variant={trendBadgeVariant(overview.trend.direction)} size='sm'>
							{overview.trend.direction === 'up' ? '+' : ''}
							{overview.trend.changePercentage}% vs previous window
						</Badge>
					</div>
				</Card>
			) : null}

			{error ? <p className='text-sm text-red-600'>{error}</p> : null}

			{isLoading ? (
				<div className='flex items-center gap-3 rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-panel) px-5 py-8 text-sm text-(--app-color-text-muted)'>
					<Spinner size='sm' />
					Loading analytics...
				</div>
			) : !overview ? (
				<EmptyState title='No analytics range selected yet' message='Choose a valid date range to load analytics.' />
			) : (
				<>
					<section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
						{statCards.map((item) => (
							<Card key={item.label} className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
								<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted)'>{item.label}</p>
								<p className='mt-2 text-3xl font-semibold text-(--app-color-text)'>{item.value}</p>
								<p className='mt-2 text-sm text-(--app-color-text-muted)'>{item.subtitle}</p>
							</Card>
						))}
					</section>

					<section className='grid gap-6 xl:grid-cols-[1.5fr_1fr]'>
						<Card
							className='border-(--app-color-border) shadow-sm'
							style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
							title='Violations over time'
							subtitle='Daily counts across the selected reporting window.'
						>
							<TrendLineChart items={timeline} />
						</Card>

						<Card
							className='border-(--app-color-border) shadow-sm'
							style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
							title='Platform distribution'
							subtitle='Which surfaces are producing the most detected misuse.'
						>
							<PlatformBars items={platforms} />
						</Card>
					</section>

					<section className='grid gap-6 xl:grid-cols-2'>
						<Card
							className='border-(--app-color-border) shadow-sm'
							style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
							title='Top violated assets'
							subtitle='Assets generating the highest infringement volume.'
						>
							{overview.topViolatedAssets?.length ? (
								<div className='space-y-3'>
									{overview.topViolatedAssets.map((item) => (
										<div key={item.assetId} className='flex items-center justify-between gap-4 rounded-xl border border-(--app-color-border) bg-(--app-color-surface) px-4 py-3'>
											<div>
												<p className='font-semibold text-(--app-color-text)'>{item.title}</p>
												<p className='text-sm capitalize text-(--app-color-text-muted)'>
													{item.type} • avg confidence {item.avgConfidenceScore}%
												</p>
											</div>
											<Badge variant='danger' size='sm'>
												{item.violationCount}
											</Badge>
										</div>
									))}
								</div>
							) : (
								<EmptyState title='No asset hotspots yet' message='Top violated assets will appear after matched detections accumulate.' />
							)}
						</Card>

						<Card
							className='border-(--app-color-border) shadow-sm'
							style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
							title='Repeat-offender domains'
							subtitle='Persistent domains help prioritize takedown and monitoring effort.'
						>
							{overview.topSourceDomains?.length ? (
								<div className='space-y-3'>
									{overview.topSourceDomains.map((item) => (
										<div key={item.domain} className='flex items-center justify-between gap-4 rounded-xl border border-(--app-color-border) bg-(--app-color-surface) px-4 py-3'>
											<div>
												<p className='font-semibold text-(--app-color-text)'>{item.domain}</p>
												<p className='text-sm text-(--app-color-text-muted)'>
													Repeat-offender score {item.repeatOffenderScore}
												</p>
											</div>
											<Badge variant='warning' size='sm'>
												{item.count}
											</Badge>
										</div>
									))}
								</div>
							) : (
								<EmptyState title='No repeat offenders yet' message='Domain persistence data will show once the same sources recur across scans.' />
							)}
						</Card>
					</section>

					<Card
						className='border-(--app-color-border) shadow-sm'
						style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
						title='Generated reports'
						subtitle='Latest downloadable analytics exports.'
					>
						{reports.length ? (
							<div className='space-y-3'>
								{reports.map((report) => (
									<div key={report._id} className='flex flex-col gap-3 rounded-xl border border-(--app-color-border) bg-(--app-color-surface) px-4 py-4 sm:flex-row sm:items-center sm:justify-between'>
										<div>
											<p className='font-semibold text-(--app-color-text)'>{report.title}</p>
											<p className='text-sm text-(--app-color-text-muted)'>
												{report.rangeLabel} • {new Date(report.generatedAt).toLocaleString()}
											</p>
										</div>
										<div className='flex items-center gap-2'>
											<Badge variant='outline' size='sm'>
												{report.stats?.totalViolations || 0} violations
											</Badge>
											<a
												href={report.fileUrl}
												target='_blank'
												rel='noreferrer'
												className='inline-flex items-center justify-center rounded-lg bg-(--app-color-primary) px-4 py-2 text-sm font-medium text-white transition hover:bg-(--app-color-primary-hover)'
											>
												Download PDF
											</a>
										</div>
									</div>
								))}
							</div>
						) : (
							<EmptyState title='No reports generated yet' message='Create your first analytics PDF from the control bar above.' />
						)}
					</Card>
				</>
			)}
		</div>
	);
}
