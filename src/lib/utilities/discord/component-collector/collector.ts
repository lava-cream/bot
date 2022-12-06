import type {
  MessageComponentTypeResolvable,
  Message,
  MessageCollectorOptionsParams,
  Awaitable,
  MappedInteractionTypes,
  InteractionCollector,
} from 'discord.js';
import { CollectorActionManager } from './collector.action-manager.js';
import type { CollectorActionContext } from './collector.action.js';

/**
 * Options to create a {@link Collector}.
 * @template T The component type.
 * @template Cached Whether the interaction came from a cached message.
 * @since 6.0.0
 */
export interface CollectorOptions<in out T extends MessageComponentTypeResolvable, in out Cached extends boolean> extends MessageCollectorOptionsParams<T, Cached> {
  /**
   * The message to collect interactions from.
   */
  message: Message<Cached>;
  /**
   * The type of the message component to collect.
   */
  componentType?: T;
  /**
   * Called when the InteractionCollector attached emits the `end` event.
   */
  end?: CollectorEndPredicate<T, Cached>;
}

/**
 * The predicate to call when the collector ends.
 * @template T The component's type.
 * @template Cached The cache status.
 */
type CollectorEndPredicate<T extends MessageComponentTypeResolvable, Cached extends boolean> = (
  /**
   * The context for this predicate.
   */
  context: Omit<CollectorActionContext<T, Cached>, 'interaction' | 'action'> & Readonly<{
    /**
     * The interaction or null if no interactions were found from the collected elements.
     */
    interaction: MappedInteractionTypes<Cached>[T] | null;
    /**
     * The reason why the collector ended.
     */
    reason: string;
    /**
     * Checks if the InteractionCollector attached stopped this collector from running.
     */
    wasInternallyStopped(): boolean
  }>
) => Awaitable<void>;

/**
 * Represents a component collector.
 * @template Cached The default cache type of the interaction.
 * @template T The message component's type.
 * @version 6.0.0
 * @since 4.7.2
 */
export class Collector<in out T extends MessageComponentTypeResolvable, Cached extends boolean = boolean> {
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
   * The component collector's constructor.
   * @param options Options to create an interaction collector.
   */
  public constructor(public options: CollectorOptions<T, Cached>) {}

  /**
   * Starts collecting for interactions.
   * @returns None.
   */
  public start(): Promise<void> {
    return new Promise(async (resolve) => {
      const collector = (this.collector = this.options.message.createMessageComponentCollector<T>(this.options));

      collector.on('collect', (interaction) => {
        const action = this.actions.resolve(interaction.customId);
        return action?.run({ interaction, action, collector, message: this.options.message });
      });

      collector.on('end', (collected, reason) => {
        return this.options.end?.({ 
          interaction: collected.find((i) => i.customId === this.actions.resolve(collected.last()?.customId!)?.id) ?? null, 
          message: this.options.message, 
          collector, 
          reason, 
          wasInternallyStopped: () => ['time', 'idle', 'user'].includes(reason),
        });
      });

      collector.once('end', () => resolve());
    });
  }
}
