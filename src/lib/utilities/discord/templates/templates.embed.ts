import { createEmbed } from "#lib/utilities/builders/utilities.js";

/**
 * Represents a discord.js utility to create embeds based on different templates.
 * @since 6.0.0
 */
export namespace EmbedTemplates {
  /**
   * Creates a simple, embedded message content.
   * @param message The message to display.
   * @returns An embed.
   * @since 6.0.0
   */
  export function createSimple(message: string) {
    return createEmbed(embed => embed.setColor(0x2f3136).setDescription(message));
  }
}