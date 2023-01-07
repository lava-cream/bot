import { Collection, MessageComponentTypeResolvable as ComponentType, Snowflake } from 'discord.js';
import { CollectorAction, CollectorActionLogic } from './collector.action.js';
import type { Collector } from './collector.js';

/**
 * The collector's action manager.
 * @template T The component type.
 * @template Cached The cache status of the interaction.
 */
export class CollectorActionManager<in out T extends ComponentType, Cached extends boolean> {
  /**
   * The actions of this manager.
   */
  public actions = new Collection<Snowflake, CollectorAction<T, Cached>>();

  /**
   * The action manager's constructor.
   * @param collector The component collector.
   */
  public constructor(public collector: Collector<T, Cached>) { }

  /**
   * Constructs a {@link CollectorAction}.
   * @param id The id of the action.
   * @param logic The action's logic.
   * @returns A {@link CollectorAction}.
   */
  public construct(id: string, logic: CollectorActionLogic<T, Cached>) {
    return Reflect.construct(CollectorAction, [id, logic]);
  }

  /**
   * Registeres a collector action into this manager.
   * @param args The parameters to construct a {@link CollectorAction}.
   * @returns A {@link CollectorAction} instance.
   */
  public add(id: string, logic: CollectorActionLogic<T, Cached>): CollectorAction<T, Cached> {
    return this.actions.ensure(id, () => this.construct(id, logic));
  }

  /**
   * Removes a registered action from this manager.
   * @param id The id of the action to register.
   * @returns The id of the removed action.
   */
  public remove(id: string) {
    this.actions.delete(id);
    return id;
  }

  /**
   * Resolves an action.
   * @param id The id of the action to resolve.
   * @returns The action or `null` if it does not exist.
   * @since 6.0.0
   */
  public resolve(id: string) {
    return this.actions.get(id) ?? null;
  }

  /**
   * Clears and sets the actions for this actions manager.
   * @param actions The actions to set.
   * @returns The total amount of actions in this manager.
   */
  public set(actions: CollectorAction<T, Cached>[]): number {
    this.actions.clear();

    return actions
      .reduce((manager, action) => {
        this.add(action.id, action.logic);
        return manager;
      }, this.actions)
      .size;
  }
}
