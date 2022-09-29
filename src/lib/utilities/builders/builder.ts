import type { Callback } from '#lib/utilities';

/**
 * An abstract class for all builders.
 * @since 6.0.0
 */
export class Builder {
  /**
   * Attaching a callback function allows this builder to call that function to build this builder.
   * @param builder The callback function to attach.
   * @returns This builder.
   */
  public apply(builder: BuilderCallback<this>): this {
    return Builder.build(this, builder);
  }

  /**
   * Builds a builder by calling the builder and passing the instance as both the `this` and `builder` parameter.
   * @param instance An instance of a {@link Builder} or any builder.
   * @param builder The builder callback function.
   */
  public static build<T>(instance: T, builder: BuilderCallback<T>): T {
    return builder.call(instance, instance);
  }
}

/**
 * Represents a builder callback function.
 * @template T The builder's type.
 * @since 6.0.0
 */
export type BuilderCallback<T> = Callback<[builder: T], T, T>;
