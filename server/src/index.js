import 'dotenv/config';

import { createServer } from 'node:http';
import cron from 'node-cron';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { initializeRealtimeServer } from './config/socket.js';
import { runScheduledScanJob } from './jobs/scan.job.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDatabase();

  const server = createServer(app);
  initializeRealtimeServer(server);

  cron.schedule('0 */6 * * *', async () => {
    try {
      await runScheduledScanJob();
    } catch (error) {
      console.error('[SCAN_CRON_ERROR]', error.message);
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
