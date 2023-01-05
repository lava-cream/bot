import { createEmbed } from "#lib/utilities/builders/utilities.js";
import { Constants } from "discord.js";

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
    return createEmbed(embed => embed.setColor(Constants.Colors.DARK_BUT_NOT_BLACK).setDescription(message));
  }
}