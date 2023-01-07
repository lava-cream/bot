import Package from '../../../../package.json' assert { type: 'json' };
import { container } from '@sapphire/pieces';

Reflect.defineProperty(container, 'package', {
  value: Package,
  configurable: false,
  writable: false,
  enumerable: false
});

export { Package };

declare module '@sapphire/pieces' {
  interface Container {
    package: Readonly<typeof Package>;
  }
}
