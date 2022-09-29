import { container } from '@sapphire/framework';

export class Base<T> {
  public constructor(protected readonly data: T) {}

  public get container() {
    return container;
  }
}
