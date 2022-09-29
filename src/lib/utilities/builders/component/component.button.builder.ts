import { MessageButton } from 'discord.js';
import { Builder } from '../builder.js';
import { Mixin } from 'ts-mixer';
import { isNullish } from '@sapphire/utilities';

export class ButtonBuilder extends Mixin(MessageButton, Builder) {
  public override setLabel(label: MessageButton['label']): this {
    if (isNullish(label)) this.label = label;
    if (!isNullish(label)) super.setLabel(label);
    return this;
  }
}
