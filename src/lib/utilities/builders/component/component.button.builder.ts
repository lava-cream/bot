import { ButtonBuilder } from 'discord.js';
import { Builder } from '../builder.js';
import { Mixin } from 'ts-mixer';

export class ButtonComponentBuilder extends Mixin(ButtonBuilder, Builder) {}
