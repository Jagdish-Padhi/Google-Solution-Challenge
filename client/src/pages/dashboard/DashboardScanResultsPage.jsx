import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Globe, Radio, Send, Video } from 'lucide-react';

import { Badge, Button, Card, EmptyState, Spinner } from '../../components';
import api from '../../services/api.js';

function statusVariant(status) {
	if (status === 'completed') {
		return 'success';
	}

	if (status === 'running') {
		return 'warning';
	}

	if (status === 'failed') {
		return 'danger';
	}

	return 'info';
}

function platformIcon(platform) {
	if (platform === 'youtube') {
		return <Video className='h-4 w-4 text-red-600' />;
	}

	if (platform === 'twitter') {
		return <Radio className='h-4 w-4 text-sky-600' />;
	}

	if (platform === 'telegram') {
		return <Send className='h-4 w-4 text-blue-600' />;
	}

	return <Globe className='h-4 w-4 text-slate-600' />;
}

export default function DashboardScanResultsPage() {
	const { jobId } = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [scanJob, setScanJob] = useState(null);
	const [results, setResults] = useState([]);

	async function loadData() {
		try {
			const [statusResponse, resultsResponse] = await Promise.all([
				api.get(`/scans/${jobId}/status`),
				api.get(`/scans/${jobId}/results?page=1&limit=100`),
			]);

			setScanJob(statusResponse.data.scanJob || null);
			setResults(resultsResponse.data.items || []);
			setError('');
		} catch {
			setError('Unable to load scan details right now.');
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		loadData();
	}, [jobId]);

	useEffect(() => {
		if (!scanJob || !['queued', 'running'].includes(scanJob.status)) {
			return undefined;
		}

		const timer = setInterval(() => {
			loadData();
		}, 5000);

		return () => clearInterval(timer);
	}, [scanJob?.status, jobId]);

	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<h2 className='text-2xl font-semibold text-(--app-color-text)'>Scan results</h2>
					<p className='text-sm text-(--app-color-text-muted)'>Review discovered URLs and platform metadata for this scan job.</p>
				</div>
				<Link to='/dashboard/scans'>
					<Button variant='secondary'>Back to scans</Button>
				</Link>
			</div>

			{error ? <p className='text-sm text-red-600'>{error}</p> : null}

			<Card className='border-(--app-color-border) shadow-sm' style={{ backgroundColor: 'var(--app-color-surface-panel)' }}>
				{isLoading ? (
					<div className='flex items-center gap-3 text-sm text-(--app-color-text-muted)'>
						<Spinner size='sm' />
						Loading scan details...
					</div>
				) : scanJob ? (
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<div>
							<p className='text-sm font-semibold text-(--app-color-text)'>Scan ID: {scanJob._id}</p>
							<p className='text-xs text-(--app-color-text-muted)'>Platforms: {scanJob.platforms?.join(', ') || '-'}</p>
						</div>
						<Badge variant={statusVariant(scanJob.status)}>{scanJob.status}</Badge>
					</div>
				) : null}
			</Card>

			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
				title='Discovered results'
				subtitle='Rows update as scans complete.'
			>
				{!isLoading && results.length === 0 ? (
					<EmptyState title='No discovered URLs yet' message='Run a scan and results will appear here.' />
				) : (
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-(--app-color-border) text-sm'>
							<thead>
								<tr className='text-left text-xs uppercase tracking-[0.14em] text-(--app-color-text-muted)'>
									<th className='px-2 py-2'>Platform</th>
									<th className='px-2 py-2'>Title</th>
									<th className='px-2 py-2'>URL</th>
									<th className='px-2 py-2'>Status</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-(--app-color-border)'>
								{results.map((result) => (
									<tr key={result._id}>
										<td className='px-2 py-3'>
											<div className='flex items-center gap-2'>
												{platformIcon(result.platform)}
												<span className='capitalize'>{result.platform}</span>
											</div>
										</td>
										<td className='px-2 py-3 text-(--app-color-text)'>{result.pageTitle || '-'}</td>
										<td className='px-2 py-3'>
											<a href={result.sourceUrl} target='_blank' rel='noreferrer' className='text-(--app-color-primary) hover:underline'>
												Open source
											</a>
										</td>
										<td className='px-2 py-3'>
											<Badge variant='secondary' size='sm'>
												{result.status}
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</div>
	);
}