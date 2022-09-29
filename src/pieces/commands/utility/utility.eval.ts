import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { CommandInteraction } from 'discord.js';

import { Constants } from 'discord.js';
import { Collector, MessageContentBuilder, createComponentId } from '#lib/utilities/discord/index.js';
import { fromAsync } from '@sapphire/result';
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

  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    const code = command.options.getString('code', true);
    const session = {
      watch: new Stopwatch(),
      evaled: '',
      evalTime: 0
    };

    await command.reply('Evaluating...');
    session.watch.start();

    const evaluate = async () => {
      session.watch.restart();

      const evaled = await fromAsync<string, EvalError>(async () => {
        const inspected = inspect(await eval(this.getCode(code)), {
          breakLength: 1900,
          depth: 0,
          compact: false
        });

        return this.sanitise(inspected);
      });

      session.watch.stop();
      return (session.evaled = evaled.success ? evaled.value : evaled.error.message);
    };

    const renderContent = (done: boolean) => {
      return new MessageContentBuilder()
        .setContent(null)
        .addEmbed((embed) =>
          embed
            .setColor(done ? Constants.Colors.NOT_QUITE_BLACK : Constants.Colors.BLURPLE)
            .setDescription(codeBlock('js', session.evaled))
            .setFooter(`Duration: ${session.watch.duration.toFixed(2)}ms`)
        )
        .addComponentRow((row) =>
          Object.values(EvalControls).reduce(
            (row, customId) =>
              row.addButtonComponent((btn) =>
                btn
                  .setCustomId(createComponentId({ customId, date: new Date(command.createdTimestamp) }).customId)
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
      message: await command.editReply(renderContent(false)),
      componentType: 'BUTTON',
      time: seconds(30),
      max: Infinity,
      filter: async (button) => {
        const context = button.user.id === command.user.id;
        await button.deferUpdate();
        return context;
      }
    });

    collector.setEndAction(async (ctx) => {
      await ctx.message.edit(renderContent(true)).catch(noop);
      await command.user.send(renderEvaluatedCodeMessage()).catch(noop);
    });

    collector.actions.add(EvalControls.Repeat.toLowerCase(), async (ctx) => {
      ctx.collector.resetTimer();
      await evaluate();
      await ctx.interaction.editReply(renderContent(false));
    });

    collector.actions.add(EvalControls.Delete.toLowerCase(), async (ctx) => {
      await command.deleteReply().catch(noop);
      await ctx.interaction.deleteReply().catch(noop);
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
    );
  }
}
