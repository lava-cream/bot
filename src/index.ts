// Some mini kicking in the ass (boot).
import '@sapphire/plugin-editable-commands/register';
import '#lib/utilities/root/root.setup.js';

import { CLIENT_OPTIONS } from '#lib/framework/core/client-options.js';
import { AmariClient } from '#lib/apis/amari-bot/client/amari.client.js';
import MemersClient from '#lib/framework/core/client.js';
import { Client } from '#lib/database/client/client.js';
import { container } from '@sapphire/framework';

try {
  // Register an instance of the amari bot client to container.
  new AmariClient({ token: process.env.AMARI_API_KEY });
  // connect to discord.
  await new MemersClient(CLIENT_OPTIONS).login();

  try {
    // Connect and inject the db to the container.
    await new Client({
      connectionUri: process.env.MONGO_URI,
      username: process.env.MONGO_USER,
      password: process.env.MONGO_PASS,
      databaseName: process.env.MONGO_DB_NAME
    }).connect();
  } catch (error: unknown) {
    container.logger.fatal('[DATABASE]', error);
  }
} catch (error: unknown) {
  container.logger.fatal('[CLIENT]', error);
  process.exit(1);
}
