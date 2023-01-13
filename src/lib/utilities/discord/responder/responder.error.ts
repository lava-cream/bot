import { InteractionMessageContentBuilder } from "#lib/utilities/builders/index.js";
import type { CacheType, GuildCacheMessage } from "discord.js";
import { EmbedTemplates } from "../templates/templates.embed.js";
import * as Responder from "./lib/index.js";

/**
 * The responder error utility.
 * @since 6.0.0
 */
export namespace ResponderError {
  /**
   * Creates a pre-built {@link InteractionMessageContentBuilder message content} builder that displays an error message.
   * @param message The error message string.
   * @returns A {@link InteractionMessageContentBuilder} instance.
   * @since 6.0.0
   */
  export function createErrorContentBuilder(message: string) {
    return new InteractionMessageContentBuilder().addEmbed(() => EmbedTemplates.createSimple(message));
  }
  
  /**
   * Creates a simple, clean and readable error message via the specified target. 
   * @param target The interaction to send the interaction through.
   * @param message The message content string.
   * @returns A possible message object.
   * @since 6.0.0
   */
  export function send<Cached extends CacheType>(target: Responder.ResponderTarget<Cached>, message: string): Promise<GuildCacheMessage<Cached>> {
    return Responder.send(target, createErrorContentBuilder(message));
  }
  
  /**
   * Creates a simple, clean and readable error message via the specified target.
   * @param target The interaction to edit the interaction from.
   * @param message The message content string.
   * @returns A possible message object.
   * @since 6.0.0
   */
  export function edit<Cached extends CacheType>(target: Responder.ResponderTarget<Cached>, message: string): Promise<GuildCacheMessage<Cached>> {
    return Responder.edit(target, createErrorContentBuilder(message));
  }
}
