import { srcDir } from '#lib/utilities';
import { Constants, Intents, Options } from 'discord.js';
import { join } from 'node:path';

import { ClientOptionsBuilder } from './client-options.builder.js';

export const CLIENT_OPTIONS = new ClientOptionsBuilder()
  .setPartials({ partials: [Constants.PartialTypes.REACTION] })
  .setPresence({ presence: { status: 'dnd', afk: false } })
  .setMakeCache({ makeCache: Options.cacheEverything() })
  .setListenerOptions({ loadMessageCommandListeners: false, loadDefaultErrorListeners: false })
  .setSupportGuild({ supportGuild: process.env.SUPPORT_ID })
  .setBaseUserDirectory({ baseUserDirectory: join(srcDir, 'pieces') })
  .setIntents({
    intents: [
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_MESSAGES
    ]
  });

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPPORT_ID: string;
    }
  }
}
