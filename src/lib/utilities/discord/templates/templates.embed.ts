import { Builder, BuilderCallback } from "#lib/utilities";
import { MessageEmbed } from "discord.js";

/**
 * Represents a discord.js utility to create embeds based on different templates.
 * @since 6.0.0
 */
export namespace EmbedTemplates {
  /**
   * Creates a blank embed with its color camouflaging Discord's dark mode. 
   * @param cb A callback that builds the embed AFTER applying the template.
   * @returns An embed.
   * @since 6.0.0
   */
  export function createCamouflaged(cb = ((embed => embed) as BuilderCallback<MessageEmbed>)) {
    return Builder.build(new MessageEmbed().setColor(0x2f3136), cb);
  }

  /**
   * Creates a simple, embedded message content.
   * @param description The description to display.
   * @param cb A callback that builds the embed AFTER applying the template.
   * @returns An embed.
   * @since 6.0.0
   */
  export function createSimple(description: string, cb = ((embed => embed) as BuilderCallback<MessageEmbed>)) {
    return createCamouflaged(cb).setDescription(description);
  }
}