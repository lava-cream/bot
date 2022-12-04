import '@sapphire/plugin-subcommands/register';
import '#lib/utilities/root/root.setup.js';

import { CLIENT_OPTIONS } from '#lib/framework/core/client-options.js';
import { AmariClient } from '#lib/apis/amari-bot/client/amari.client.js';
import { Client } from '#lib/database/client/client.js';
import { container, Result } from '@sapphire/framework';
import MemersClient from '#lib/framework/core/client.js';

const exitWithError = (tag: string, ...message: any[]) => {
  container.logger.error(`[${tag}]`, ...message);
  return process.exit(1);
}

new AmariClient({ token: process.env.AMARI_API_KEY });

const [login, db] = await Promise.all([
  await Result.fromAsync(new MemersClient(CLIENT_OPTIONS).login()),
  await Result.fromAsync(
    new Client({
      connectionUri: process.env.MONGO_URI,
      username: process.env.MONGO_USER,
      password: process.env.MONGO_PASS,
      databaseName: process.env.MONGO_DB_NAME
    }).connect()
  )
] as const);

if (login.isErr()) exitWithError('CLIENT', 'Unable to connect to Discord.', login.unwrapErr());
if (db.isErr()) exitWithError('DATABASE', 'Unable to connect to the database.', db.unwrapErr());