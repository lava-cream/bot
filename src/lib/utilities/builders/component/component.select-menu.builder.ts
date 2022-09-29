import { type MessageSelectOptionData, MessageSelectMenu } from 'discord.js';
import { Builder } from '../builder.js';
import { Mixin } from 'ts-mixer';

export class SelectMenuBuilder extends Mixin(MessageSelectMenu, Builder) {
  public addOption(option: MessageSelectOptionData): this {
    return this.addOptions(option);
  }
}
