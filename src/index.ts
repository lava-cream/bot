// Quick Setup
import '@sapphire/plugin-subcommands/register';
import '#lib/utilities/root/root.setup.js';

// Clients
import MemersClient from '#lib/framework/core/client.js';
import DatabaseClient from '#lib/database/client/client.js';
import AmariClient from '#lib/apis/amari-bot/client/amari.client.js';

// Misc
import { CLIENT_OPTIONS } from '#lib/framework/core/client-options.js';
import { container, Result } from '@sapphire/framework';
import chalk from 'chalk';

await Result
  .fromAsync(Reflect.construct(MemersClient, [CLIENT_OPTIONS]).login())
  .then(result => result.inspectErr((err) => container.logger.fatal(chalk.redBright(err))));

Result
  .ok(new AmariClient({ token: process.env.AMARI_API_KEY }))
  .inspect(amari => container.logger.info(chalk.yellow(`${amari.constructor.name} instance created.`)))

await Result
  .fromAsync(
    Reflect.construct(DatabaseClient, [{
      connectionUri: process.env.MONGO_URI,
      username: process.env.MONGO_USER,
      password: process.env.MONGO_PASS,
      databaseName: process.env.MONGO_DB_NAME,
    }]).connect()
  )
  .then(result => result.inspectErr((err) => container.logger.fatal(chalk.redBright(err))));