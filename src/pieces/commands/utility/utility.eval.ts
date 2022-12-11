import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { CommandInteraction } from 'discord.js';

import { Constants } from 'discord.js';
import {
  Collector,
  MessageContentBuilder,
  InteractionMessageContentBuilder,
  ComponentId,
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
    const componentCustomId = new ComponentId(new Date(command.createdTimestamp));
    const session = {
      watch: new Stopwatch(),
      evaled: '',
      evalTime: 0
    };

    await edit(command, 'Evaluating...');
    session.watch.start();

    const evaluate = async () => {
      session.watch.restart();

      const evaled = await Result.fromAsync<string, EvalError>(async () => {
        const inspected = inspect(await eval(this.getCode(code)), {
          breakLength: 1900,
          depth: 0,
          compact: false
        });

        return this.sanitise(inspected);
      });

      session.watch.stop();
      return (session.evaled = evaled.isOk() ? evaled.unwrap() : evaled.unwrapErr().message);
    };

    const renderContent = (done: boolean) => {
      return new InteractionMessageContentBuilder()
        .setContent(null)
        .addEmbed((embed) =>
          embed
            .setColor(done ? Constants.Colors.NOT_QUITE_BLACK : Constants.Colors.BLURPLE)
            .setDescription(codeBlock('js', session.evaled))
            .setFooter({ text: `Duration: ${session.watch.duration.toFixed(2)}ms` })
        )
        .addRow((row) =>
          Object.values(EvalControls).reduce(
            (row, customId) =>
              row.addButtonComponent((btn) =>
                btn
                  .setCustomId(componentCustomId.create(customId).id)
                  .setStyle(done ? Constants.MessageButtonStyles.SECONDARY : Constants.MessageButtonStyles.PRIMARY)
                  .setLabel(toTitleCase(customId))
                  .setDisabled(done)
              ),
            row
          )
        );
    };

    const renderEvaluatedCodeMessage = () => {
      return new MessageContentBuilder().addEmbed((embed) =>
        embed.setTitle('Evaluated Code').setColor(Constants.Colors.BLURPLE).setDescription(codeBlock('js', code))
      );
    };

    await evaluate();

    const collector = new Collector({
      message: await edit(command, renderContent(false)),
      componentType: 'BUTTON',
      time: seconds(60),
      max: Infinity,
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

    collector.actions.add(componentCustomId.create(EvalControls.Repeat).id, async (ctx) => {
      ctx.collector.resetTimer();
      await evaluate();
      await edit(ctx.interaction, renderContent(false));
    });

    collector.actions.add(componentCustomId.create(EvalControls.Delete).id, async (ctx) => {
      await unsend(command).catch(noop);
      await unsend(ctx.interaction).catch(noop);
      ctx.collector.stop(ctx.interaction.customId);
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
