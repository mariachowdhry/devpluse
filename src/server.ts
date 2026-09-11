import app from './app';
import { env } from './config/env';
import { initDB } from './db';

async function start(): Promise<void> {
  try {
    await initDB();
  } catch (err) {
    console.error(' Could not connect to the database on startup:', err);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(
      `listening on port ${env.port} [${env.nodeEnv}]`
    );
  });
}

start();
