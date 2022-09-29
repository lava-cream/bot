process.env.NODE_ENV ??= 'development';

import { inspect } from 'node:util';
import { config } from 'dotenv-cra';

void config();

inspect.defaultOptions.depth = 1;
