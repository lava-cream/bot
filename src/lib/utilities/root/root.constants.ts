import { getRootData } from '@sapphire/pieces';
import { join } from 'node:path';

/**
 * Returns the root directory.
 */
export const rootDir = getRootData().root;

/**
 * The src directory.
 */
export const srcDir = join(rootDir);

/**
 * The pieces directory.
 */
export const piecesDir = join(srcDir, 'pieces');
