import { GatewayIntentBits, Options } from 'discord.js';
import { piecesDir } from '#lib/utilities';

import { ClientOptionsBuilder } from './client-options.builder.js';
import { Partials } from 'discord.js';

export const CLIENT_OPTIONS = new ClientOptionsBuilder()
	.setPartials({ partials: [Partials.Reaction] })
	.setPresence({ presence: { status: 'dnd', afk: false } })
	.setMakeCache({ makeCache: Options.cacheEverything() })
	.setListenerOptions({ loadMessageCommandListeners: false, loadDefaultErrorListeners: false })
	.setSupportGuild({ supportGuild: process.env.SUPPORT_ID })
	.setBaseUserDirectory({ baseUserDirectory: piecesDir })
	.setIntents({
		intents: [
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildEmojisAndStickers,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessages
		]
	});

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			SUPPORT_ID: string;
		}
	}
}
