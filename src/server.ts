import app from './app';
import { env } from './config/env';
import { testConnection } from './config/db';

async function start(): Promise<void> {
  try {
    await testConnection();
  } catch (err) {
    console.error('❌ Could not connect to the database on startup:', err);
    // Continue starting the server anyway; individual requests will
    // surface a 500 if the DB is genuinely unreachable. This avoids
    // crash-looping on platforms where the DB comes up slightly later.
  }

  app.listen(env.port, () => {
    console.log(`🚀 DevPulse API listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

start();
