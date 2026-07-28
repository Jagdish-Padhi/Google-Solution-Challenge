export async function healthController(_req, res) {
  let mlStatus = 'unreachable';
  const mlUrl = process.env.ML_SERVICE_URL;

  if (mlUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${mlUrl.replace(/\/$/, '')}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        mlStatus = 'ok';
      }
    } catch {
      mlStatus = 'waking';
    }
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sportshield-server',
    mlService: mlStatus,
  });
}

