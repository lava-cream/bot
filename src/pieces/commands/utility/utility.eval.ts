import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { CommandInteraction } from 'discord.js';

import { Constants } from 'discord.js';
import {
  Collector,
  MessageContentBuilder,
  InteractionMessageContentBuilder,
  CustomId,
  DeferCommandInteraction,
  edit,
  unsend
} from '#lib/utilities';
import { Result } from '@sapphire/result';
import { Stopwatch } from '@sapphire/stopwatch';
import { codeBlock } from '@discordjs/builders';
import { seconds } from '#lib/utilities/common/index.js';
import { inspect } from 'node:util';
import { noop, toTitleCase } from '@sapphire/utilities';
import { PreconditionNames } from '#lib/framework';

enum EvalControls {
  Repeat = 'repeat',
  Delete = 'delete'
}

@ApplyOptions<Command.Options>({
  name: 'eval',
  description: "You don't need any docs for this because you're a fucking nerd.",
  preconditions: [PreconditionNames.UserOwnerOnly],
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class EvalCommand extends Command {
  private getCode(rawCode: string): string {
    const isPromise = rawCode.includes('await') || rawCode.includes('return');
    return isPromise ? `(async () => { ${rawCode} })();` : rawCode;
  }

  private sanitise(evaled: string): string {
    const tokens = [this.container.client.token!, process.env.AMARI_API_KEY];

    for (const token of tokens) {
      const spotted = new RegExp(token, 'gi');
      if (evaled.match(spotted)) evaled = evaled.replaceAll(spotted, '*');
    }

    return evaled;
  }

  @DeferCommandInteraction()
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    const code = command.options.getString('code', true);
    const dm = command.options.getBoolean('dm') ?? false;
    const customId = new CustomId(new Date(command.createdTimestamp));
    const context = { watch: new Stopwatch(), evaled: '' };

    await edit(command, (content) => content.addEmbed((embed) => embed.setTitle('Please wait...').setColor(Constants.Colors.NOT_QUITE_BLACK)));
    context.watch.start();

    const evaluate = async () => {
      context.watch.restart();

      const evaled = await Result.fromAsync<string, EvalError>(async () => {
        const inspected = inspect(await eval(this.getCode(code)), {
          breakLength: 1900,
          depth: 0,
          compact: false,
        });

        return this.sanitise(inspected);
      });

      evaled.inspectErr(err => Reflect.set(context, 'evaled', err.message));
      evaled.inspect(evaled => Reflect.set(context, 'evaled', evaled));
      context.watch.stop();

      return context.evaled;
    };

    const renderContent = (done: boolean) => {
      return new InteractionMessageContentBuilder()
        .addEmbed((embed) =>
          embed
            .setColor(done ? Constants.Colors.NOT_QUITE_BLACK : Constants.Colors.BLURPLE)
            .setDescription(codeBlock('js', context.evaled))
            .setFooter({ text: `Duration: ${context.watch.toString()}` })
        )
        .addRow((row) =>
          Object.values(EvalControls).reduce(
            (row, control) =>
              row.addButtonComponent((btn) =>
                btn
                  .setCustomId(customId.create(control))
                  .setStyle(done ? Constants.MessageButtonStyles.SECONDARY : Constants.MessageButtonStyles.PRIMARY)
                  .setLabel(toTitleCase(control))
                  .setDisabled(done)
              ),
            row
          )
        );
    };

    const renderEvaluatedCodeMessage = () => {
      return new MessageContentBuilder().addEmbed((embed) =>
        embed.setTitle('Evaluated Code').setColor(Constants.Colors.BLURPLE).setDescription(codeBlock('js', inspect(code, { depth: 0 })))
      );
    };

    await evaluate();

    const collector = new Collector({
      message: await edit(command, renderContent(false)),
      componentType: 'BUTTON',
      time: seconds(10),
      max: Infinity,
      actions: {
        [customId.create(EvalControls.Repeat)]: async (ctx) => {
          ctx.collector.resetTimer();
          await evaluate();
          await edit(ctx.interaction, renderContent(false));
        },
        [customId.create(EvalControls.Delete)]: async (ctx) => {
          await unsend(command).catch(noop);
          await unsend(ctx.interaction).catch(noop);
          ctx.collector.stop(ctx.interaction.customId);
        }
      },
      filter: async (button) => {
        const context = button.user.id === command.user.id;
        await button.deferUpdate();
        return context;
      },
      end: async () => {
        await edit(command, renderContent(true)).catch(noop);
        if (dm) await command.user.send(renderEvaluatedCodeMessage()).catch(noop);
      }
    });

    await collector.start();
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((string) => string.setName('code').setDescription('The code to evaluate.').setRequired(true))
        .addBooleanOption((boolean) => boolean.setName('dm').setDescription('If the bot will DM you the code you ran.'))
    );
  }
}
