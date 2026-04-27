import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
	Activity, 
	AlertTriangle, 
	BarChart3, 
	Clock, 
	Download,
	ExternalLink,
	FileCheck, 
	FileText, 
	Fingerprint, 
	Globe, 
	History, 
	IndianRupee, 
	PieChart, 
	Search, 
	ShieldAlert, 
	ShieldCheck, 
	Target, 
	TrendingDown, 
	TrendingUp, 
	Zap 
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, Loader } from '../../components';
import api from '../../services/api.js';
import useReportStore from '../../store/report.store.js';
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';

const rangeOptions = [
	{ value: '7d', label: 'Last 7 days' },
	{ value: '30d', label: 'Last 30 days' },
	{ value: '90d', label: 'Last 90 days' },
	{ value: 'custom', label: 'Custom range' },
];

function resolveReportDownloadUrl(fileUrl) {
	if (!fileUrl) {
		return '#';
	}

	if (/^https?:\/\//i.test(fileUrl)) {
		return fileUrl;
	}

	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
	const apiOrigin = new URL(apiBaseUrl).origin;

	return `${apiOrigin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

function inferDownloadFileName(report) {
	if (report?.fileName) {
		return report.fileName;
	}

	if (report?.fileUrl) {
		try {
			const resolvedUrl = new URL(resolveReportDownloadUrl(report.fileUrl));
			const pathParts = resolvedUrl.pathname.split('/').filter(Boolean);
			const lastSegment = pathParts[pathParts.length - 1];

			if (lastSegment) {
				return lastSegment;
			}
		} catch {
			return 'analytics-report.pdf';
		}
	}

	return 'analytics-report.pdf';
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
	const [hoveredPoint, setHoveredPoint] = useState(null);

	if (!items.length) {
		return <EmptyState title='No timeline data' message='Run more scans to build trend visibility.' />;
	}

	const maxValue = Math.max(...items.map((item) => item.count), 1);
	
	const pointsList = items.map((item, index) => {
		const x = items.length === 1 ? 220 : 10 + (index / (items.length - 1)) * 420;
		const y = 140 - (item.count / maxValue) * 120;
		return { x, y, item };
	});
	
	const pointsString = pointsList.map(p => `${p.x},${p.y}`).join(' ');
	const firstX = pointsList[0].x;
	const lastX = pointsList[pointsList.length - 1].x;
	const areaString = `${firstX},140 ${pointsString} ${lastX},140`;

	return (
		<div className='space-y-6 relative group/chart py-2'>
			<style>
				{`
					@keyframes drawLine {
						from { stroke-dashoffset: 2000; }
						to { stroke-dashoffset: 0; }
					}
					@keyframes fadeArea {
						from { opacity: 0; }
						to { opacity: 1; }
					}
					.animated-line {
						stroke-dasharray: 2000;
						stroke-dashoffset: 2000;
						animation: drawLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
					}
					.animated-area {
						opacity: 0;
						animation: fadeArea 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s forwards;
					}
				`}
			</style>
			
			<div className="relative w-full">
				<svg viewBox='0 0 440 150' className='w-full h-auto overflow-visible' preserveAspectRatio='none'>
					<defs>
						<linearGradient id='analytics-line' x1='0%' y1='0%' x2='100%' y2='0%'>
							<stop offset='0%' stopColor='var(--app-color-primary)' />
							<stop offset='100%' stopColor='#0f766e' />
						</linearGradient>
						<linearGradient id='analytics-area' x1='0%' y1='0%' x2='0%' y2='100%'>
							<stop offset='0%' stopColor='var(--app-color-primary)' stopOpacity='0.15' />
							<stop offset='100%' stopColor='#0f766e' stopOpacity='0' />
						</linearGradient>
					</defs>
					
					{/* Horizontal Grid lines */}
					{[0, 0.25, 0.5, 0.75, 1].map(ratio => (
						<g key={ratio}>
							<line 
								x1='0' y1={140 - ratio * 120} 
								x2='440' y2={140 - ratio * 120} 
								stroke='var(--app-color-border)' 
								strokeWidth='1' 
								strokeDasharray={ratio === 0 ? "" : "4 4"}
								opacity={ratio === 0 ? 1 : 0.5}
							/>
							{/* Y-axis labels */}
							{ratio > 0 && (
								<text 
									x="0" 
									y={140 - ratio * 120 - 4} 
									fontSize="8" 
									fontWeight="bold"
									fill="var(--app-color-text-muted)"
									opacity="0.6"
								>
									{Math.round(ratio * maxValue)}
								</text>
							)}
						</g>
					))}

					{/* Vertical hover line indicator */}
					{hoveredPoint && (
						<line 
							x1={hoveredPoint.x} y1={hoveredPoint.y} 
							x2={hoveredPoint.x} y2="140" 
							stroke="var(--app-color-text-muted)" 
							strokeWidth="1" 
							strokeDasharray="3 3"
							opacity="0.6"
							className="animate-in fade-in duration-200"
						/>
					)}

					{/* Filled Area under the curve */}
					<polygon
						points={areaString}
						fill='url(#analytics-area)'
						className='animated-area'
					/>

					{/* The Stroke Line */}
					<polyline
						fill='none'
						stroke='url(#analytics-line)'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						points={pointsString}
						className='animated-line'
					/>

					{/* Data Points */}
					{pointsList.map((p) => {
						const isHovered = hoveredPoint?.x === p.x;
						return (
							<g 
								key={p.item.date} 
								className="cursor-pointer"
								onMouseEnter={() => setHoveredPoint(p)}
								onMouseLeave={() => setHoveredPoint(null)}
							>
								{/* Actual dot - hidden unless hovered */}
								<circle 
									cx={p.x} 
									cy={p.y} 
									r='4.5'
									fill='var(--app-color-surface)'
									stroke='var(--app-color-primary)'
									strokeWidth='2'
									opacity={isHovered ? 1 : 0}
									className="transition-opacity duration-150"
								/>
								{/* Invisible hover target */}
								<circle cx={p.x} cy={p.y} r='16' fill='transparent' />
							</g>
						);
					})}
					{/* Tooltip Overlay perfectly synced inside SVG coordinate space */}
					{hoveredPoint && (
						<foreignObject 
							x={hoveredPoint.x - 60} 
							y={hoveredPoint.y - 60} 
							width="120" 
							height="55"
							className="overflow-visible pointer-events-none"
						>
							<div className="flex flex-col items-center justify-end h-full w-full animate-in fade-in zoom-in-95 duration-150">
								<div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-xl shadow-teal-900/20 border border-slate-700/50 flex flex-col items-center">
									<span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap leading-none">{hoveredPoint.item.label}</span>
									<span className="text-sm font-black text-teal-400 tabular-nums leading-tight mt-0.5">
										{hoveredPoint.item.count}
										<span className="text-[8px] text-slate-500 font-bold ml-1">VIOLATIONS</span>
									</span>
								</div>
								<div className="w-2.5 h-2.5 bg-slate-900 rotate-45 border-r border-b border-slate-700/50 -mt-1.5 z-[-1]"></div>
							</div>
						</foreignObject>
					)}
				</svg>
			</div>

			{/* X-Axis labels below the chart */}
			<div className='flex justify-between text-[10px] font-bold uppercase tracking-widest text-(--app-color-text-muted) px-2 mt-4'>
				{items.filter((_, i) => i % Math.max(1, Math.floor(items.length / 7)) === 0).map((item) => {
					const parts = item.label.split(' ');
					return (
						<span key={item.date} className="text-center inline-block">
							{parts[0]}<br/><span className="text-slate-400">{parts[1] || ''}</span>
						</span>
					);
				})}
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

function TopDomainsList({ items }) {
	if (!items.length) {
		return <EmptyState title='No domains tracked yet' message='Violations from different domains will appear here.' />;
	}

	return (
		<div className='space-y-2'>
			{items.map((item) => (
				<div key={item.domain} className='flex flex-col gap-2 rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
					<div className='min-w-0'>
						<p className='truncate font-medium text-(--app-color-text)'>
							{item.domain}
						</p>
						<p className='text-xs text-(--app-color-text-muted)'>
							{item.count} violation{item.count !== 1 ? 's' : ''}
						</p>
					</div>
					{item.repeatOffenderScore > 50 && (
						<div className='flex items-center gap-2 whitespace-nowrap'>
							<span className='inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800'>
								Repeat Offender
							</span>
							<p className='text-sm text-(--app-color-text-muted)'>Score: {item.repeatOffenderScore}</p>
						</div>
					)}
				</div>
			))}
		</div>
	);
}

function KPIMetricsGrid({ kpis }) {
	if (!kpis) {
		return null;
	}

	const { detectionTime, repeatOffenderRatio, falsePositiveRate, resolutionSLA } = kpis;

	return (
		<section className='grid gap-6 md:grid-cols-2 xl:grid-cols-4'>
			<Card className='border-(--app-color-border) shadow-sm group hover:border-(--app-color-primary)/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Detection Time</p>
						<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>
							{detectionTime.meanTimeHours > 24 ? `${Math.round(detectionTime.meanTimeHours / 24)}d` : `${detectionTime.meanTimeHours}h`}
						</p>
					</div>
					<div className="h-12 w-12 rounded-2xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) group-hover:scale-110 transition-transform">
						<Zap size={22} />
					</div>
				</div>
				<p className='mt-4 text-[10px] text-(--app-color-text-muted) border-t border-(--app-color-border)/50 pt-2'>
					{detectionTime.count} assets tracked
				</p>
			</Card>

			<Card className='border-(--app-color-border) shadow-sm group hover:border-red-500/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Repeat Offenders</p>
						<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{repeatOffenderRatio.ratio}%</p>
					</div>
					<div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
						<ShieldAlert size={22} />
					</div>
				</div>
				<p className='mt-4 text-[10px] text-(--app-color-text-muted) border-t border-(--app-color-border)/50 pt-2'>
					{repeatOffenderRatio.repeatOffenderCount} identified domains
				</p>
			</Card>

			<Card className='border-(--app-color-border) shadow-sm group hover:border-amber-500/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>False Positives</p>
						<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{falsePositiveRate.rate}%</p>
					</div>
					<div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
						<Target size={22} />
					</div>
				</div>
				<p className='mt-4 text-[10px] text-(--app-color-text-muted) border-t border-(--app-color-border)/50 pt-2'>
					{falsePositiveRate.falsePositiveCount} of {falsePositiveRate.totalViolations}
				</p>
			</Card>

			<Card className='border-(--app-color-border) shadow-sm group hover:border-emerald-500/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>SLA Compliance</p>
						<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{resolutionSLA.slaCompliancePercentage}%</p>
					</div>
					<div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
						<ShieldCheck size={22} />
					</div>
				</div>
				<p className='mt-4 text-[10px] text-(--app-color-text-muted) border-t border-(--app-color-border)/50 pt-2'>
					Avg Resolution: {resolutionSLA.avgTimeHours}h
				</p>
			</Card>
		</section>
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
	const [kpis, setKpis] = useState(null);
	const [reports, setReports] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const { startGeneration, isGenerating, generatedReport } = useReportStore();
	const [error, setError] = useState('');
	const location = useLocation();
	const reportsRef = useRef(null);

	useEffect(() => {
		if (location.hash === '#reports-section' && !isLoading && reportsRef.current) {
			const timer = setTimeout(() => {
				reportsRef.current.scrollIntoView({ behavior: 'smooth' });
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [location, isLoading]);

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

	const loadData = useCallback(async () => {
		if (range === 'custom' && (!customDates.startDate || !customDates.endDate)) {
			setOverview(null);
			setTimeline([]);
			setPlatforms([]);
			setKpis(null);
			return;
		}

		try {
			setIsLoading(true);
			const [overviewResponse, timelineResponse, platformsResponse, kpisResponse, reportsResponse] = await Promise.all([
				api.get('/analytics/overview', { params: queryParams }),
				api.get('/analytics/timeline', { params: queryParams }),
				api.get('/analytics/platforms', { params: queryParams }),
				api.get('/analytics/kpis', { params: queryParams }),
				api.get('/reports', { params: { limit: 5 } }),
			]);

			setOverview(overviewResponse.data);
			setTimeline(timelineResponse.data.items || []);
			setPlatforms(platformsResponse.data.items || []);
			setKpis(kpisResponse.data.kpis || null);
			setReports(reportsResponse.data?.items || []);
		} catch {
			setError('Unable to load analytics right now.');
		} finally {
			setIsLoading(false);
		}
	}, [queryParams, range, customDates]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		if (generatedReport) {
			setReports((current) => {
				if (current.some(r => r._id === generatedReport._id)) return current;
				return [generatedReport, ...current].slice(0, 5);
			});
		}
	}, [generatedReport]);

	const handleViewReport = (report) => {
		const viewUrl = resolveReportDownloadUrl(report?.fileUrl);
		if (viewUrl === '#') return toast.error('Report view not available.');
		window.open(viewUrl, '_blank', 'noopener,noreferrer');
	};

	const handleGenerateReport = async () => {
		if (range === 'custom' && (!customDates.startDate || !customDates.endDate)) {
			toast.error('Select both custom dates before generating a report.');
			return;
		}
		
		await startGeneration(queryParams);
	};

	const handleDownloadReport = async (report) => {
		const downloadUrl = resolveReportDownloadUrl(report?.fileUrl);

		if (!report?._id || downloadUrl === '#') {
			toast.error('Report file is not available for download.');
			return;
		}

		try {
			const response = await api.get(downloadUrl, {
				responseType: 'blob',
			});

			const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
			const anchor = document.createElement('a');
			anchor.href = blobUrl;
			anchor.setAttribute('download', inferDownloadFileName(report));
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			window.URL.revokeObjectURL(blobUrl);
		} catch {
			toast.error('Unable to download report right now.');
		}
	};

	const statCards = overview
		? [
				{ label: 'Total violations', value: overview.totalViolations, subtitle: overview.rangeLabel, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
				{ label: 'Revenue at risk', value: `₹${(overview.estimatedRevenueLoss || 0).toLocaleString()}`, subtitle: 'Est. value of stolen media', icon: IndianRupee, color: 'text-(--app-color-primary)', bg: 'bg-(--app-color-primary-soft)' },
				{ label: 'Resolved', value: overview.resolvedViolations, subtitle: `${Math.round((overview.resolutionRate || 0) * 100)}% resolution rate`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
				{ label: 'Avg confidence', value: `${overview.avgConfidenceScore}%`, subtitle: 'Across detected matches', icon: Activity, color: 'text-(--app-color-primary)', bg: 'bg-(--app-color-primary-soft)' },
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

					<Button onClick={handleGenerateReport} loading={isGenerating} disabled={isGenerating} className="flex items-center gap-2">
						<FileText size={16} />
						Generate report
					</Button>
				</div>
			</div>

			{overview?.trend ? (
				<Card className='border-(--app-color-border) shadow-sm group hover:border-(--app-color-primary)/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
					<div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
						<div className="flex items-start gap-4">
							<div className="mt-1 h-10 w-10 rounded-xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary)">
								<Activity size={20} className="animate-pulse" />
							</div>
							<div>
								<p className='text-xs uppercase tracking-[0.16em] text-(--app-color-text-muted) font-black'>Trend signal</p>
								<p className='mt-1 text-lg font-black text-(--app-color-text)'>
									{overview.trend.currentWindowViolations} violations in {overview.rangeLabel}
								</p>
								<p className='mt-1 text-xs text-(--app-color-text-muted)'>
									Compared with {overview.trend.previousWindowViolations} in the previous equivalent window.
								</p>
							</div>
						</div>
						<Badge variant={trendBadgeVariant(overview.trend.direction)} size='sm' className="flex items-center gap-1.5 font-bold tracking-wider">
							{overview.trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
							{overview.trend.changePercentage}% vs previous
						</Badge>
					</div>
				</Card>
			) : null}

			{error ? <p className='text-sm text-red-600'>{error}</p> : null}

			{isLoading ? (
				<div className='flex flex-col items-center justify-center py-20 gap-6 rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-panel) text-sm text-(--app-color-text-muted)'>
					<Loader size={0.7} />
					<p className="font-bold uppercase tracking-widest animate-pulse">Running advanced heuristics...</p>
				</div>
			) : !overview ? (
				<EmptyState title='No analytics range selected yet' message='Choose a valid date range to load analytics.' />
			) : (
				<>
					{kpis ? <KPIMetricsGrid kpis={kpis} /> : null}

					<section className='grid gap-6 md:grid-cols-2 xl:grid-cols-4'>
						{statCards.map((item) => (
							<Card key={item.label} className='border-(--app-color-border) shadow-sm group hover:border-(--app-color-primary)/50 transition-all duration-300' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted)'>{item.label}</p>
										<p className='text-3xl font-black text-(--app-color-text) tabular-nums'>{item.value}</p>
									</div>
									<div className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
										<item.icon size={22} />
									</div>
								</div>
								<p className='mt-4 text-[10px] text-(--app-color-text-muted) border-t border-(--app-color-border)/50 pt-2'>
									{item.subtitle}
								</p>
							</Card>
						))}
					</section>

					<section className='grid gap-6 xl:grid-cols-[1.5fr_1fr]'>
						<Card
							className='border-(--app-color-border) shadow-sm'
							style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
							title={
								<div className="flex items-center gap-2">
									<BarChart3 size={18} className="text-(--app-color-primary)" />
									Violations over time
								</div>
							}
							subtitle='Daily counts across the selected reporting window.'
						>
							<TrendLineChart items={timeline} />
						</Card>

						<Card
							className='border-(--app-color-border) shadow-sm'
							style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
							title={
								<div className="flex items-center gap-2">
									<PieChart size={18} className="text-(--app-color-primary)" />
									Platform distribution
								</div>
							}
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
						ref={reportsRef}
						id="reports-section"
						className='border-(--app-color-border) shadow-sm scroll-mt-24'
						style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
						title='Generated reports'
						subtitle='Latest downloadable analytics exports.'
					>
						{reports.length ? (
							<div className='space-y-3'>
								{reports.map((report) => (
									<div key={report._id} className='flex flex-col gap-3 rounded-xl border border-(--app-color-border) bg-(--app-color-surface) px-4 py-4 sm:flex-row sm:items-center sm:justify-between group/report hover:border-(--app-color-primary)/30 transition-colors'>
										<div className="flex items-start gap-3">
											<div className="mt-1 h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover/report:bg-(--app-color-primary-soft) group-hover/report:text-(--app-color-primary) transition-colors">
												<FileText size={20} />
											</div>
											<div>
												<p className='font-bold text-(--app-color-text)'>{report.title}</p>
												<p className='text-[10px] uppercase tracking-wider text-(--app-color-text-muted) flex items-center gap-1.5'>
													<Clock size={12} />
													{report.rangeLabel} • {new Date(report.generatedAt).toLocaleString()}
												</p>
											</div>
										</div>
										<div className='flex items-center gap-4'>
											<Badge variant='outline' size='sm' className="font-bold tracking-wider">
												{report.stats?.totalViolations || 0} VIOLATIONS
											</Badge>
											<div className="flex items-center gap-2">
												<button
													type='button'
													onClick={() => handleViewReport(report)}
													className='inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 transition hover:bg-slate-200 active:scale-95'
												>
													<ExternalLink size={14} />
													View
												</button>
												<button
													type='button'
													onClick={() => handleDownloadReport(report)}
													className='inline-flex items-center justify-center gap-2 rounded-lg bg-(--app-color-primary) px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-(--app-color-primary-hover) shadow-sm active:scale-95'
												>
													<Download size={14} />
													Download PDF
												</button>
											</div>
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
