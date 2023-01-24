import type { ChatInputOrContextMenuCommandInteraction, PaginatedMessagePage } from '@sapphire/discord.js-utilities';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';

export async function paginate(interaction: ChatInputOrContextMenuCommandInteraction, pages: PaginatedMessagePage[]): Promise<void> {
	await new PaginatedMessage({ embedFooterSeparator: '—' }).addPages(pages).run(interaction);
}
