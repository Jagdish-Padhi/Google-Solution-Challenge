import { useCallback, useEffect, useState } from 'react';
import { Camera, PencilLine, Search, Trash2, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge, Button, Card, Spinner } from '../../components';
import api from '../../services/api.js';

export default function CreatorPortfolioPage() {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [titleDraft, setTitleDraft] = useState('');

  const loadAssets = useCallback(async () => {
    try {
      const res = await api.get('/assets?page=1&limit=50');
      setAssets(res.data.items || []);
    } catch {
      toast.error('Unable to load your portfolio.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'My Works — SportShield Creator';
    loadAssets();
  }, [loadAssets]);

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Delete this work from your portfolio?')) return;
    try {
      await api.delete(`/assets/${assetId}`);
      setAssets((prev) => prev.filter((asset) => asset._id !== assetId));
      toast.success('Work removed from your portfolio.');
    } catch {
      toast.error('Unable to delete this asset.');
    }
  };

  const handleRenameAsset = async (assetId) => {
    try {
      await api.patch(`/assets/${assetId}/update`, { title: titleDraft.trim() });
      toast.success('Asset title updated.');
      setAssets((prev) => prev.map((asset) => asset._id === assetId ? { ...asset, title: titleDraft.trim() } : asset));
      setEditingId(null);
    } catch {
      toast.error('Unable to rename this asset.');
    }
  };

  const handleScanAsset = async (asset) => {
    try {
      await api.post('/scans/start', {
        assetId: asset._id,
        searchKeywords: [asset.title || 'portfolio', 'copyright', 'repost'],
        platforms: ['youtube', 'twitter', 'web'],
        multiLanguage: false,
      });
      toast.success('Scan started for this asset.');
    } catch {
      toast.error('Unable to start scan for this asset.');
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-6 py-24 text-sm text-(--app-color-text-muted)'>
        <Spinner size='md' />
        <p className='font-bold uppercase tracking-widest animate-pulse'>Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-7xl space-y-8 p-6 lg:p-10'>
      <div>
        <h1 className='text-3xl font-black tracking-tight text-(--app-color-text)'>My Works</h1>
        <p className='text-base text-(--app-color-text-muted)'>Keep your uploaded photography and video visible, editable, and protected in one place.</p>
      </div>

      {assets.length === 0 ? (
        <Card className='border-dashed border-(--app-color-border) bg-slate-50/70 p-12 text-center shadow-sm'>
          <UploadCloud size={40} className='mx-auto text-(--app-color-primary)' />
          <h2 className='mt-4 text-xl font-black text-(--app-color-text)'>Your portfolio is empty</h2>
          <p className='mt-2 text-sm text-(--app-color-text-muted)'>Upload your first photo or video to start fingerprinting and protecting it.</p>
          <Button onClick={() => window.location.assign('/creator')} className='mt-5'>Protect Your First Work →</Button>
        </Card>
      ) : (
        <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
          {assets.map((asset) => {
            const isProcessing = asset.status === 'processing';
            return (
              <Card key={asset._id} className='overflow-hidden border-(--app-color-border) shadow-sm'>
                <div className='h-40 bg-slate-100'>
                  {asset.thumbnailUrl || asset.storageUrl ? (
                    <img src={asset.thumbnailUrl || asset.storageUrl} alt={asset.title} className='h-full w-full object-cover' />
                  ) : (
                    <div className='flex h-full items-center justify-center'><Camera size={32} className='text-slate-300' /></div>
                  )}
                </div>
                <div className='space-y-4 p-4'>
                  <div>
                    <div className='flex items-center justify-between gap-3'>
                      {editingId === asset._id ? (
                        <input
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          className='w-full rounded-lg border border-(--app-color-border) bg-white px-3 py-2 text-sm font-semibold text-(--app-color-text)'
                        />
                      ) : (
                        <h3 className='text-base font-black text-(--app-color-text)'>{asset.title || 'Untitled Work'}</h3>
                      )}
                      <button
                        type='button'
                        onClick={() => {
                          if (editingId === asset._id) {
                            handleRenameAsset(asset._id);
                          } else {
                            setEditingId(asset._id);
                            setTitleDraft(asset.title || '');
                          }
                        }}
                        className='rounded-lg border border-(--app-color-border) bg-slate-50 p-2 text-slate-600 hover:bg-slate-100'
                      >
                        <PencilLine size={14} />
                      </button>
                    </div>
                    <div className='mt-2 flex items-center gap-2'>
                      <Badge variant={asset.type === 'video' ? 'primary' : 'secondary'} size='sm'>{asset.type === 'video' ? 'Video' : 'Photo'}</Badge>
                      <Badge variant={isProcessing ? 'warning' : 'success'} size='sm'>{isProcessing ? 'Processing...' : 'Fingerprinted ✓'}</Badge>
                    </div>
                  </div>
                  <div className='space-y-1 text-xs text-(--app-color-text-muted)'>
                    <p>Uploaded {new Date(asset.uploadedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className={asset.violationsFound > 0 ? 'font-semibold text-red-600' : 'font-semibold text-emerald-600'}>
                      {asset.violationsFound > 0 ? `${asset.violationsFound} unauthorized uses found` : 'No theft detected'}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm' onClick={() => handleScanAsset(asset)} className='flex items-center gap-2'>
                      <Search size={14} /> Scan Now
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => handleDeleteAsset(asset._id)} className='flex items-center gap-2 text-red-600'>
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
