import type { MessageFlagsString, MessageOptions, MessageMentionOptions, StickerResolvable, BitFieldResolvable } from 'discord.js';
import type { MessageActionRowBuilderComponents, BuilderCallback } from '#lib/utilities';
import { pushElement, Builder, MessageActionRowBuilder } from '#lib/utilities';
import { MessageEmbed, MessageAttachment } from 'discord.js';

export type MessageContent = Pick<
  MessageOptions,
  'tts' | 'nonce' | 'content' | 'embeds' | 'components' | 'allowedMentions' | 'files' | 'stickers' | 'attachments'
>;

export abstract class BaseMessageContentBuilder<
    Components extends MessageActionRowBuilderComponents = MessageActionRowBuilderComponents,
    Flags extends MessageFlagsString = MessageFlagsString
  >
  extends Builder
  implements MessageContent
{
  public tts?: boolean;
  public nonce?: string | number;
  public content?: string | null;
  public embeds?: MessageEmbed[];
  public components?: MessageActionRowBuilder<Components>[];
  public allowedMentions?: MessageMentionOptions;
  public files?: MessageAttachment[];
  public stickers?: StickerResolvable[];
  public attachments?: MessageAttachment[];
  public flags?: BitFieldResolvable<Flags, number>;

  public setTTS(tts: boolean): this {
    this.tts = tts;
    return this;
  }

  public setNonce(nonce: string | number): this {
    this.nonce = nonce;
    return this;
  }

  public setContent(content: string | null): this {
    this.content = content;
    return this;
  }

  public addEmbed(builder: BuilderCallback<MessageEmbed>): this {
    pushElement((this.embeds ??= []), Builder.build(new MessageEmbed(), builder));
    return this;
  }

  public addRow(builder: BuilderCallback<MessageActionRowBuilder<Components>>): this {
    pushElement((this.components ??= []), Builder.build(new MessageActionRowBuilder(), builder));
    return this;
  }

  public setAllowedMentions(allowedMentions: MessageMentionOptions): this {
    this.allowedMentions = allowedMentions;
    return this;
  }

  public addFile(attachment: ConstructorParameters<typeof MessageAttachment>[0], builder: BuilderCallback<MessageAttachment>): this {
    pushElement((this.files ??= []), Builder.build(new MessageAttachment(attachment), builder));
    return this;
  }

  public addSticker(sticker: StickerResolvable): this {
    pushElement((this.stickers ??= []), sticker);
    return this;
  }

  public addAttachment(...[attachment, builder]: Parameters<this['addFile']>): this {
    pushElement((this.attachments ??= []), Builder.build(new MessageAttachment(attachment), builder));
    return this;
  }

  public setFlags(flags: Flags): this {
    this.flags = flags;
    return this;
  }
}
