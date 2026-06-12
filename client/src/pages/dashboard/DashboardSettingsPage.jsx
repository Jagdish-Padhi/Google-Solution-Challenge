import { useCallback, useEffect, useState } from 'react';
import {
	Bell,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	Mail,
	Send,
	Webhook,
	Zap,
	X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button, Card, Loader, Spinner } from '../../components';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';

export default function DashboardSettingsPage() {
	const { user, setDemoRole } = useAuthStore();
	const [org, setOrg] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSendingDigest, setIsSendingDigest] = useState(false);
	const [isSavingPrefs, setIsSavingPrefs] = useState(false);
	const [isSavingWebhook, setIsSavingWebhook] = useState(false);
	const [prefs, setPrefs] = useState({
		emailDigest: false,
		emailOnHighConfidence: true,
		inAppAlerts: true,
	});
	const [webhookUrl, setWebhookUrl] = useState('');
	const [lastDigestSentAt, setLastDigestSentAt] = useState(null);

	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteRole, setInviteRole] = useState('analyst');
	const [isInviting, setIsInviting] = useState(false);
	const [isRemoving, setIsRemoving] = useState(null);

	const loadOrg = useCallback(async () => {
		try {
			const response = await api.get('/organization/me');
			const data = response.data.organization;
			setOrg(data);
			setPrefs({
				emailDigest: data.notificationPrefs?.emailDigest ?? false,
				emailOnHighConfidence: data.notificationPrefs?.emailOnHighConfidence ?? true,
				inAppAlerts: data.notificationPrefs?.inAppAlerts ?? true,
			});
			setWebhookUrl(data.notificationPrefs?.webhookUrl || '');
			setLastDigestSentAt(data.lastDigestSentAt || null);
		} catch {
			toast.error('Unable to load organization settings.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadOrg();
	}, [loadOrg]);

	const handleSavePrefs = async () => {
		setIsSavingPrefs(true);
		try {
			await api.patch('/organization/notification-prefs', {
				...prefs,
				webhookUrl,
			});
			toast.success('Notification preferences saved.');
		} catch {
			toast.error('Failed to save preferences.');
		} finally {
			setIsSavingPrefs(false);
		}
	};

	const handleSaveWebhook = async () => {
		setIsSavingWebhook(true);
		try {
			await api.patch('/organization/notification-prefs', {
				...prefs,
				webhookUrl: webhookUrl.trim(),
			});
			toast.success('Webhook URL updated.');
		} catch {
			toast.error('Failed to save webhook URL.');
		} finally {
			setIsSavingWebhook(false);
		}
	};

	const handleSendDigest = async () => {
		setIsSendingDigest(true);
		try {
			const response = await api.post('/organization/send-digest');
			const { message, sent, skipped, lastDigestSentAt: newTs } = response.data;

			if (sent) {
				toast.success(message);
				setLastDigestSentAt(newTs);
			} else if (skipped) {
				toast(message, { icon: 'ℹ️' });
			}
		} catch {
			toast.error('Failed to trigger weekly digest.');
		} finally {
			setIsSendingDigest(false);
		}
	};

	const handleInvite = async () => {
		if (!inviteEmail) return;
		setIsInviting(true);
		try {
			const response = await api.post('/organization/invite', {
				email: inviteEmail,
				role: inviteRole
			});
			toast.success('Invitation sent.');
			setOrg(prev => ({ ...prev, members: response.data.members }));
			setInviteEmail('');
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to send invite.');
		} finally {
			setIsInviting(false);
		}
	};

	const handleRemoveMember = async (email) => {
		setIsRemoving(email);
		try {
			const response = await api.delete(`/organization/member/${email}`);
			toast.success('Member removed.');
			setOrg(prev => ({ ...prev, members: response.data.members }));
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to remove member.');
		} finally {
			setIsRemoving(null);
		}
	};

	const Toggle = ({ checked, onChange, id }) => (
		<button
			id={id}
			type='button'
			role='switch'
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
				checked ? 'bg-[var(--app-color-primary)]' : 'bg-slate-200'
			}`}
		>
			<span
				className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
					checked ? 'translate-x-6' : 'translate-x-1'
				}`}
			/>
		</button>
	);

	if (isLoading) {
		return (
			<div className='flex flex-col items-center justify-center py-24 gap-6 text-sm text-(--app-color-text-muted)'>
				<Loader size={0.5} />
				<p className='font-bold uppercase tracking-widest animate-pulse'>Loading settings...</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* ── Page header ─────────────────────────────────────────── */}
			<div className='flex items-start justify-between'>
				<div>
					<h2 className='text-2xl font-semibold text-(--app-color-text)'>Organization Settings</h2>
					<p className='text-sm text-(--app-color-text-muted) mt-0.5'>
						Manage your organization profile, notification preferences, and proactive monitoring settings.
					</p>
				</div>
				<div className='flex items-center gap-3'>
					<span className='text-xs font-semibold text-(--app-color-text-muted)'>Demo Role:</span>
					<div className='flex rounded-lg border border-(--app-color-border) bg-(--app-color-surface) p-1'>
						<button
							onClick={() => setDemoRole('admin')}
							className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${user?.role === 'admin' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
						>
							Admin
						</button>
						<button
							onClick={() => setDemoRole('legal')}
							className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${user?.role === 'legal' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
						>
							Legal
						</button>
					</div>
				</div>
			</div>

			{/* ── Org profile card ─────────────────────────────────────── */}
			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
			>
				<div className='flex items-center gap-4'>
					<div className='h-12 w-12 rounded-xl bg-(--app-color-primary-soft) flex items-center justify-center shrink-0'>
						<Building2 size={22} className='text-(--app-color-primary)' />
					</div>
					<div className='flex-1 min-w-0'>
						<p className='text-[10px] font-black uppercase tracking-[0.2em] text-(--app-color-text-muted) mb-0.5'>Organization</p>
						<p className='text-lg font-black text-(--app-color-text) uppercase tracking-tight truncate'>{org?.orgName}</p>
					</div>
				</div>

				{/* Metadata row — always horizontal, fits comfortably */}
				<div className='mt-5 pt-4 border-t border-(--app-color-border)/60 flex flex-row items-start gap-10'>
					<div className='min-w-0'>
						<p className='text-[10px] font-black uppercase tracking-[0.15em] text-(--app-color-text-muted) mb-1'>Email</p>
						<p className='text-sm font-medium text-(--app-color-text) flex items-center gap-1.5'>
							<Mail size={12} className='text-(--app-color-text-muted) shrink-0' />
							{org?.email}
						</p>
					</div>
					<div className='shrink-0'>
						<p className='text-[10px] font-black uppercase tracking-[0.15em] text-(--app-color-text-muted) mb-1'>Plan</p>
						<span className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest ${org?.plan === 'pro' ? 'text-emerald-600' : 'text-(--app-color-text-muted)'}`}>
							<span className={`h-1.5 w-1.5 rounded-full ${org?.plan === 'pro' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
							{org?.plan === 'pro' ? 'Pro' : 'Free'}
						</span>
					</div>
					<div className='shrink-0'>
						<p className='text-[10px] font-black uppercase tracking-[0.15em] text-(--app-color-text-muted) mb-1'>Member since</p>
						<p className='text-sm font-medium text-(--app-color-text) flex items-center gap-1.5'>
							<Calendar size={12} className='text-(--app-color-text-muted) shrink-0' />
							{org?.createdAt ? new Date(org.createdAt).toLocaleDateString([], { dateStyle: 'medium' }) : '—'}
						</p>
					</div>
				</div>
			</Card>

			{/* ── Team Management ────────────────────────────────────────── */}
			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
			>
				<div className='flex items-center gap-2 mb-1'>
					<Building2 size={15} className='text-(--app-color-primary) shrink-0' />
					<h3 className='text-sm font-black uppercase tracking-widest text-(--app-color-text) leading-none'>Team Management</h3>
				</div>
				<p className='text-xs text-(--app-color-text-muted) mb-4 leading-relaxed'>
					Invite team members and assign roles to restrict access to sensitive operations. Legal roles can only view high-confidence violations.
				</p>
				
				<div className='flex flex-wrap gap-2 mb-6'>
					<input
						type='email'
						value={inviteEmail}
						onChange={(e) => setInviteEmail(e.target.value)}
						placeholder='colleague@sportshield.com'
						className='flex-1 rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) placeholder:text-(--app-color-text-muted) focus:border-(--app-color-primary) focus:outline-none transition-colors'
					/>
					<select
						value={inviteRole}
						onChange={(e) => setInviteRole(e.target.value)}
						className='rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm text-(--app-color-text) focus:border-(--app-color-primary) focus:outline-none transition-colors'
					>
						<option value='admin'>Admin (Full Access)</option>
						<option value='analyst'>Analyst (View & Scan)</option>
						<option value='legal'>Legal (Only {'>'}85% Violations)</option>
					</select>
					<Button onClick={handleInvite} disabled={isInviting || !inviteEmail} className='flex items-center gap-2 h-9 text-xs shrink-0'>
						{isInviting ? <Spinner size='xs' /> : <Send size={13} />}
						Send Invite
					</Button>
				</div>

				{org?.members?.length > 0 && (
					<div className='divide-y divide-(--app-color-border)/50 border-t border-(--app-color-border)/50 pt-2'>
						{org.members.map((member, idx) => (
							<div key={idx} className='flex items-center justify-between py-3 group'>
								<div className='flex items-center gap-3'>
									<div className='h-8 w-8 rounded-full bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) font-bold text-xs uppercase'>
										{member.email.charAt(0)}
									</div>
									<div>
										<p className='text-sm font-semibold text-(--app-color-text)'>{member.email}</p>
										<p className='text-xs text-(--app-color-text-muted) capitalize'>{member.role}</p>
									</div>
								</div>
								<div className='flex items-center gap-3'>
									<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
										member.inviteStatus === 'active' 
										? 'bg-emerald-50 text-emerald-600 border border-emerald-200/70' 
										: 'bg-amber-50 text-amber-600 border border-amber-200/70'
									}`}>
										{member.inviteStatus}
									</span>
									<button 
										onClick={() => handleRemoveMember(member.email)}
										disabled={isRemoving === member.email}
										className='opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-all'
										title="Remove Member"
									>
										{isRemoving === member.email ? <Spinner size="xs" /> : <X size={14} />}
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</Card>

			{/* ── Weekly Digest ─────────────────────────────────────────── */}
			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
			>
				{/* Card header */}
				<div className='flex items-center gap-2 mb-1'>
					<Zap size={15} className='text-amber-500 shrink-0' />
					<h3 className='text-sm font-black uppercase tracking-widest text-(--app-color-text) leading-none'>
						Proactive Monitoring — Weekly Digest
					</h3>
					<span className='ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200/70'>
						Scheduled
					</span>
				</div>
				<p className='text-xs text-(--app-color-text-muted) mb-4 leading-relaxed'>
					Aggregates all violations from the past 7 days into a structured intelligence report.
					Auto-runs every <strong className='text-(--app-color-text)'>Monday at 09:00</strong>.
					Use the button below to trigger an immediate run for demo purposes.
				</p>

				{/* Digest trigger row */}
				<div className='flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-(--app-color-canvas-glow) border border-(--app-color-border)/60'>
					<div className='flex items-center gap-3'>
						<div className='h-9 w-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0'>
							<Clock size={16} className='text-amber-600' />
						</div>
						<div>
							<p className='text-[10px] font-black uppercase tracking-widest text-(--app-color-text-muted) leading-none mb-0.5'>Last Digest Sent</p>
							<p className='text-sm font-semibold text-(--app-color-text)'>
								{lastDigestSentAt
									? new Date(lastDigestSentAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
									: <span className='text-(--app-color-text-muted) italic font-normal text-xs'>Never triggered</span>
								}
							</p>
						</div>
					</div>

					<button
						type='button'
						onClick={handleSendDigest}
						disabled={isSendingDigest}
						className='group relative flex h-9 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-5 text-[11px] font-black uppercase tracking-widest text-white hover:text-white shadow-md shadow-amber-900/15 transition-all hover:scale-[1.02] hover:shadow-amber-900/25 active:scale-95 disabled:opacity-60 whitespace-nowrap'
					>
						<div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700' />
						{isSendingDigest ? <Spinner size='xs' /> : <Send size={13} />}
						{isSendingDigest ? 'Generating…' : 'Send Digest Now'}
					</button>
				</div>

				{lastDigestSentAt && (
					<div className='mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest'>
						<CheckCircle2 size={11} strokeWidth={3} />
						Digest engine is active — last run completed successfully.
					</div>
				)}
			</Card>

			{/* ── Notification preferences ─────────────────────────────── */}
			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
			>
				<div className='flex items-center gap-2 mb-5'>
					<Bell size={15} className='text-(--app-color-primary) shrink-0' />
					<h3 className='text-sm font-black uppercase tracking-widest text-(--app-color-text) leading-none'>Notification Preferences</h3>
				</div>

				<div className='divide-y divide-(--app-color-border)/50'>
					{[
						{
							id: 'emailDigest',
							label: 'Weekly digest email',
							description: 'Receive a structured Monday report summarising all violations from the past 7 days.',
							key: 'emailDigest',
						},
						{
							id: 'emailOnHighConfidence',
							label: 'High-confidence alerts',
							description: 'Send an immediate email when a violation is detected with ≥ 80% match confidence.',
							key: 'emailOnHighConfidence',
						},
						{
							id: 'inAppAlerts',
							label: 'In-app alert feed',
							description: 'Show real-time alerts in the notification feed inside the dashboard.',
							key: 'inAppAlerts',
						},
					].map(({ id, label, description, key }) => (
						<div key={id} className='flex items-center justify-between gap-6 py-3.5 first:pt-0 last:pb-0'>
							<div className='flex-1 min-w-0'>
								<p className='text-sm font-semibold text-(--app-color-text)'>{label}</p>
								<p className='text-xs text-(--app-color-text-muted) mt-0.5 leading-snug'>{description}</p>
							</div>
							<Toggle
								id={id}
								checked={prefs[key]}
								onChange={(val) => setPrefs((p) => ({ ...p, [key]: val }))}
							/>
						</div>
					))}
				</div>

				<div className='mt-5 pt-4 border-t border-(--app-color-border)/50 flex justify-end'>
					<Button onClick={handleSavePrefs} disabled={isSavingPrefs} className='flex items-center gap-2 h-9 text-xs'>
						{isSavingPrefs ? <Spinner size='xs' /> : <CheckCircle2 size={13} />}
						Save preferences
					</Button>
				</div>
			</Card>

			{/* ── Webhook Integration ───────────────────────────────────── */}
			<Card
				className='border-(--app-color-border) shadow-sm'
				style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
			>
				<div className='flex items-center gap-2 mb-1'>
					<Webhook size={15} className='text-(--app-color-primary) shrink-0' />
					<h3 className='text-sm font-black uppercase tracking-widest text-(--app-color-text) leading-none'>Webhook Integration</h3>
				</div>
				<p className='text-xs text-(--app-color-text-muted) mb-4 leading-relaxed'>
					Post violation events to your own endpoint in real time. SportShield will send a signed JSON payload on every new detection.
				</p>
				<div className='flex gap-2'>
					<input
						type='url'
						value={webhookUrl}
						onChange={(e) => setWebhookUrl(e.target.value)}
						placeholder='https://your-server.com/webhook'
						className='flex-1 rounded-lg border border-(--app-color-border) bg-(--app-color-surface) px-3 py-2 text-sm font-mono text-(--app-color-text) placeholder:text-(--app-color-text-muted) focus:border-(--app-color-primary) focus:outline-none transition-colors'
					/>
					<Button onClick={handleSaveWebhook} disabled={isSavingWebhook} className='flex items-center gap-2 shrink-0 h-9 text-xs'>
						{isSavingWebhook ? <Spinner size='xs' /> : <CheckCircle2 size={13} />}
						Save
					</Button>
				</div>
			</Card>
		</div>
	);
}
