import type { ChatInputOrContextMenuInteraction, PaginatedMessagePage } from '@sapphire/discord.js-utilities';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';

export async function paginate(interaction: ChatInputOrContextMenuInteraction, pages: PaginatedMessagePage[]): Promise<void> {
  await new PaginatedMessage({ embedFooterSeparator: '—' })
    .addPages(pages)
    .run(interaction);
}