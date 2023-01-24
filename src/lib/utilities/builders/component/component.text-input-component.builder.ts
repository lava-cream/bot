import { TextInputBuilder } from 'discord.js';
import { Builder } from '../builder.js';
import { Mixin } from 'ts-mixer';

export class TextInputComponentBuilder extends Mixin(TextInputBuilder, Builder) {}
