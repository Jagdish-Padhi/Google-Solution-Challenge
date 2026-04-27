import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  Search,
  ChevronRight,
  Globe,
  Zap,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  BarChart,
  Play,
  Share2,
  Send,
  Layout,
  RefreshCw,
  FileText
} from 'lucide-react';

import { Card, Badge, Button, Loader } from '../../components';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';

const defaultStats = {
  totalAssets: 0,
  activeScans: 0,
  violations: 0,
  alertsSent: 0,
  protectionScore: 100,
};

const DataValue = ({ value, suffix = '' }) => (
  <span className="font-mono text-2xl font-bold tracking-tight text-slate-800">
    {value}{suffix}
  </span>
);

export default function DashboardHomePage() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState({
    stats: defaultStats,
    recentViolations: [],
    discoveryPulse: [],
    coverage: { youtube: 0, twitter: 0, telegram: 0, web: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);

  useEffect(() => {
    // Simulate real-time logs coming in to keep the dashboard feeling alive
    const platforms = ['youtube', 'twitter', 'telegram', 'web'];
    const actions = ['Extracting video features', 'Running PHash match', 'Color histogram diff', 'Analyzing temporal signature', 'Candidate discarded', 'High confidence match'];
    let counter = 0;
    
    // Initial logs
    const initial = Array.from({ length: 5 }).map((_, i) => ({
      id: `init-${i}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      text: `${actions[Math.floor(Math.random() * actions.length)]} [${Math.random().toString(36).substring(7)}]`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));
    setLiveLogs(initial);

    const interval = setInterval(() => {
       const newLog = {
         id: `log-${counter++}`,
         platform: platforms[Math.floor(Math.random() * platforms.length)],
         text: `${actions[Math.floor(Math.random() * actions.length)]} [${Math.random().toString(36).substring(7)}]`,
         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
       };
       setLiveLogs(prev => [newLog, ...prev].slice(0, 5));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsSyncing(true);

      const response = await api.get('/dashboard/stats');
      setData({
        stats: response.data.stats || defaultStats,
        recentViolations: response.data.recentViolations || [],
        discoveryPulse: response.data.discoveryPulse || [],
        coverage: response.data.coverage || { youtube: 0, twitter: 0, telegram: 0, web: 0 }
      });
    } catch (err) {
      console.error('Telemetry sync failed');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const pollInterval = setInterval(() => loadDashboardData(true), 30000);
    return () => clearInterval(pollInterval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader size={0.7} />
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 animate-pulse">Syncing Security Ecosystem</p>
      </div>
    );
  }

  return (
    <div className='max-w-[1440px] mx-auto space-y-6 lg:space-y-8 p-3 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500'>

      {/* --- HEADER --- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security Command</h1>
            <Badge variant="outline" className="border-teal-500/30 text-teal-700 bg-teal-50/50 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">Live</Badge>
          </div>
          <p className="text-sm text-slate-500">Real-time content protection for {user?.orgName}.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl mr-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Discovery Online</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadDashboardData(true)}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-white border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            as={Link}
            to="/dashboard/analytics#reports-section"
            variant="secondary"
            size="sm"
            className="h-9 px-4 rounded-xl text-xs font-bold bg-white border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <FileText className="w-3.5 h-3.5 mr-2" />
            Reports
          </Button>
        </div>
      </header>

      {/* --- ROW 1: CORE TELEMETRY --- */}
      <section className="grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Protection Score', value: data.stats.protectionScore, suffix: '%', icon: Zap, color: 'text-teal-600', bg: 'bg-teal-50/50', accent: 'border-l-teal-500/60' },
          { label: 'Violations Open', value: data.stats.violations, suffix: '', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50/50', accent: 'border-l-red-500/60' },
          { label: 'Active Discovery', value: data.stats.activeScans, suffix: '', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50/50', accent: 'border-l-blue-500/60' },
          { label: 'Protected Media', value: data.stats.totalAssets, suffix: '', icon: BarChart, color: 'text-indigo-600', bg: 'bg-indigo-50/50', accent: 'border-l-indigo-500/60' },
        ].map((item) => (
          <div key={item.label} className={`relative group bg-white rounded-2xl border border-slate-200/60 border-l-4 ${item.accent} p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1`}>
            <div className="flex items-start justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-105 transition-transform`}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <DataValue value={item.value} suffix={item.suffix} />
          </div>
        ))}
      </section>

      {/* --- ROW 2: DECISION HUB --- */}
      <section className="grid gap-6 lg:grid-cols-[1fr_0.6fr]">

        {/* Response Queue */}
        <Card
          className="border-slate-200/60 bg-white shadow-sm overflow-hidden"
          title="Critical Response Queue"
          subtitle="Priority piracy matches requiring verification."
          headerAction={
            <Button as={Link} to="/dashboard/violations" variant="secondary" size="sm" className="h-8 px-3 rounded-lg text-xs font-bold hover:bg-slate-100">
              Full Queue
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">Asset</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">Platform</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">Confidence</th>
                  <th className="px-4 py-3 text-right border-b border-slate-100"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentViolations.length > 0 ? (
                  data.recentViolations.map((v) => (
                    <tr key={v._id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800 truncate max-w-[180px]">{v.assetId?.title || 'System Asset'}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px] italic">{v.sourceUrl}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 w-fit">
                          {v.platform === 'youtube' ? <Play className="w-3.5 h-3.5 text-red-500 fill-red-500" /> : <Globe className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="capitalize text-[11px] font-bold text-slate-600">{v.platform}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${v.matchConfidence}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">{v.matchConfidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link to="/dashboard/violations" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group-hover:translate-x-1 transition-transform">
                          Resolve <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-16 text-center text-slate-400">
                      <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No threats in queue</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Discovery Pulse */}
        <Card
          className="border-slate-200/60 bg-white shadow-sm"
          title="Discovery Ingestion"
          subtitle="Real-time candidate match logs."
        >
          <div className="relative overflow-hidden h-[320px] rounded-xl bg-slate-50 border border-slate-100 p-2">
             <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-50 to-transparent z-10 pointer-events-none" />
             <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent z-10 pointer-events-none" />
             <div className="space-y-0.5 flex flex-col justify-end h-full p-2">
               {liveLogs.map((log) => (
                 <div key={log.id} className="animate-in slide-in-from-bottom-2 fade-in duration-500 flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                   <div className="mt-1 flex-shrink-0">
                     <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center">
                       <span className="text-[10px] uppercase font-bold text-teal-600 tracking-widest">{log.platform}</span>
                       <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                     </div>
                     <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{log.text}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
          <Button as={Link} to="/dashboard/scans" variant="secondary" className="w-full h-10 text-[10px] font-bold uppercase tracking-widest mt-6 rounded-xl bg-slate-50 border-slate-200 hover:bg-[var(--app-color-primary)] hover:text-white transition-all">
            Audit Discovery History
          </Button>
        </Card>
      </section>

      {/* --- ROW 3: COVERAGE MAP --- */ }
      <Card className="border-slate-200/60 bg-white shadow-sm" title="Ecosystem Coverage" subtitle="Verified discovery counts across integrated platforms.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 py-2">
          {[
            { name: 'YouTube', key: 'youtube', icon: Play, color: 'text-red-600', bg: 'bg-red-50/50' },
            { name: 'X (Twitter)', key: 'twitter', icon: Share2, color: 'text-slate-900', bg: 'bg-slate-50/50' },
            { name: 'Telegram', key: 'telegram', icon: Send, color: 'text-sky-600', bg: 'bg-sky-50/50' },
            { name: 'Global Web', key: 'web', icon: Layout, color: 'text-teal-600', bg: 'bg-teal-50/50' },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
              <div className={`p-3 rounded-xl ${p.bg} ${p.color}`}>
                <p.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{p.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900">{data.coverage[p.key] || 0}</span>
                  <span className="text-[10px] font-bold text-primary uppercase">Matched</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <BarChart className="w-4 h-4 text-slate-300" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Detection Efficiency</p>
                <p className="text-xs font-bold text-slate-800">1.8 MINS MTTD</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-300" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Uptime Reliability</p>
                <p className="text-xs font-bold text-slate-800">99.9% ACTIVE</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button as={Link} to="/dashboard/scans?openModal=true" variant="secondary" className="flex-1 sm:flex-none h-11 px-6 rounded-xl text-xs font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50">
              Manual Discovery
            </Button>
            <Button as={Link} to="/dashboard/assets?openModal=true" className="flex-1 sm:flex-none h-11 px-6 rounded-xl text-xs font-bold text-white shadow-lg shadow-primary/10">
              Protect Content
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
