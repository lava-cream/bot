import { Builder, BuilderCallback } from '#lib/utilities/builders/builder.js';
import { FirstArgument, isFunction, isNullOrUndefined } from '@sapphire/utilities';
import type {
  MessageComponentTypeResolvable,
  MappedInteractionTypes,
  InteractionCollector,
  Collection
} from 'discord.js';
import { CollectorActionManager } from './collector.action-manager.js';
import type { CollectorActionContext, CollectorEndAction } from './collector.action.js';
import CollectorOptions, { ICollectorOptions } from './collector.options.js';

/**
 * Represents a component collector.
 * @template Cached The default cache type of the interaction.
 * @template T The message component's type.
 * @version 6.0.0
 * @since 4.7.2
 */
export class Collector<in out T extends MessageComponentTypeResolvable, Cached extends boolean = boolean> extends Builder {
  /**
   * Actions Manager
   * -
   * Actions are based from the custom id of a component. The action attached to it runs whenever the interaction it's attached to is recieved by the InteractionCollector of this collector.
   * This makes the code much more readable in some manner instead of creating isolated instances of the main {@link InteractionCollector} which is pretty "raw" or repetitive.
   */
  public readonly actions = new CollectorActionManager<T, Cached>(this);
  /**
   * Interaction Collector
   * -
   * The main interaction collector assigned for this component collector.
   */
  public collector?: InteractionCollector<MappedInteractionTypes<Cached>[T]>;
  /**
   * Collector Options
   * -
   * The collector's to-apply options for the InteractionCollector.
   */
  public options: CollectorOptions<T, Cached>;

  /**
   * The component collector's constructor.
   * @param options Options to create an interaction collector.
   */
  public constructor(options?: ICollectorOptions<T, Cached> | BuilderCallback<CollectorOptions<T, Cached>>) {
    super();
    this.options = new CollectorOptions(this, isFunction(options) ? Builder.build(new CollectorOptions(this), options) : options);
  }

  /**
   * Starts collecting for interactions.
   * @returns None.
   */
  public start(message = this.options.message): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const collector = this.createCollector(message);
      if (!collector) return reject('Missing "options.message"');

      collector
        .on('collect', (interaction) => Reflect.apply(this.onCollect, this, [interaction, collector]))
        .on('end', (collected, reason) => Reflect.apply(this.onEnd, this, [collected, reason, collector]))
        .once('end', () => resolve());
    });
  }

  /**
   * Attaches the main {@link InteractionCollector} to use for this collector.
   * @returns An instance of {@link InteractionCollector}, `false` otherwise.
   */
  private createCollector(message = this.options.message) {
    return !isNullOrUndefined(message) && (this.collector = message.createMessageComponentCollector<T>(this.options));
  }

  /**
   * Represents this collector's handler for receiving interactions emitted by the attached {@link InteractionCollector}.
   * @param interaction The interaction received by the attached {@link InteractionCollector}.
   * @param collector The attached {@link InteractionCollector}.
   * @returns Void.
   */
  private async onCollect(interaction: MappedInteractionTypes<Cached>[T], collector: InteractionCollector<MappedInteractionTypes<Cached>[T]>): Promise<void> {
    const action = this.actions.resolve(interaction.customId);
    if (isNullOrUndefined(action)) return;

    const context: CollectorActionContext<T, Cached> = { 
      action, 
      collector, 
      interaction,
      stop(reason) {
        return this.collector.stop(reason ?? this.interaction.customId);
      }, 
    };

    return Reflect.apply(action.run, action, [context]);
  }

  /**
   * Represents this collector's handler for when the {@link InteractionCollector} ends.
   * @param collected A collection of collected interactions.
   * @param reason The reasons why the collector ended.
   * @param collector An {@link InteractionCollector} instance.
   * @returns Void.
   */
  private async onEnd(collected: Collection<string, MappedInteractionTypes<Cached>[T]>, reason: string, collector: InteractionCollector<MappedInteractionTypes<Cached>[T]>): Promise<void> {
    const context: FirstArgument<CollectorEndAction<T, Cached>> = {
      collector,
      reason,
      interaction: collected.last() ?? null,
      wasInternallyStopped() {
        return Collector.NativeCollectorEndReasons.includes(this.reason);
      },
    };

    return void (!isNullOrUndefined(this.options.end) && Reflect.apply(this.options.end, null, [context]));
  }

  /**
   * An array of reasons of the {@link InteractionCollector} on why it ends on behalf of calling {@link InteractionCollector#stop}.
   */
  private static NativeCollectorEndReasons = ['time', 'user', 'idle', 'limit', 'componentLimit', 'userLimit', 'messageDelete', 'channelDelete', 'threadDelete', 'guildDelete'] satisfies string[];
}
