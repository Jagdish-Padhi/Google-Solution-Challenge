import { createScanJob, dispatchScanJob, getAssetsForScheduledScans } from '../services/scans.service.js';

export async function runScheduledScanJob() {
  const assets = await getAssetsForScheduledScans();

  for (const asset of assets) {
    const scanJob = await createScanJob({
      orgId: asset.orgId,
      assetId: asset._id,
      keywords: [asset.title],
      platforms: ['youtube', 'web'],
    });

    void dispatchScanJob(scanJob._id.toString());
  }

  return { status: 'queued', count: assets.length };
}
