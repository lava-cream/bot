import { MessageFlagsString, BaseMessageOptions, MessageMentionOptions, BitFieldResolvable, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { ActionRowComponentBuilder, BuilderCallback, removeElement } from '#lib/utilities';
import { pushElement, Builder, ActionRowBuilder } from '#lib/utilities';

export abstract class BaseMessageContentBuilder<
		Components extends ActionRowComponentBuilder = ActionRowComponentBuilder,
		Flags extends MessageFlagsString = MessageFlagsString
	>
	extends Builder
	implements BaseMessageOptions
{
	public allowedMentions?: BaseMessageOptions['allowedMentions'];
	public components?: BaseMessageOptions['components'] & ActionRowBuilder<Components>[] = [];
	public content?: BaseMessageOptions['content'];
	public embeds?: BaseMessageOptions['embeds'];
	public files?: BaseMessageOptions['files'];
	public flags?: BitFieldResolvable<Flags, number>;

	public setContent(content: string | undefined): this {
		this.content = content;
		return this;
	}

	public setEmbeds(...builders: BuilderCallback<EmbedBuilder>[]): this {
		this.embeds = [];

		for (const builder of builders) this.addEmbed(builder);
		return this;
	}

	public addEmbed(builder: BuilderCallback<EmbedBuilder>): this {
		pushElement((this.embeds ??= []), Builder.build(new EmbedBuilder(), builder));
		return this;
	}

	public setRows(...builders: BuilderCallback<ActionRowBuilder<Components>>[]): this {
		removeElement((this.components ??= []), () => true);
		for (const builder of builders) this.addRow(builder);
		return this;
	}

	public addRow(builder: BuilderCallback<ActionRowBuilder<Components>>): this {
		pushElement((this.components ??= []), Builder.build(new ActionRowBuilder<Components>(), builder));
		return this;
	}

	public setAllowedMentions(allowedMentions: MessageMentionOptions): this {
		this.allowedMentions = allowedMentions;
		return this;
	}

	public addFile(attachment: ConstructorParameters<typeof AttachmentBuilder>[0], builder: BuilderCallback<AttachmentBuilder>): this {
		pushElement((this.files ??= []), Builder.build(new AttachmentBuilder(attachment), builder));
		return this;
	}

	public setFlags(flags: Flags): this {
		this.flags = flags;
		return this;
	}
}
