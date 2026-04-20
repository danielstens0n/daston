import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function bundledWebRoot(importMetaUrl: string): string {
  let dir = dirname(fileURLToPath(importMetaUrl));
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not locate daston package root above ${importMetaUrl}`);
    }
    dir = parent;
  }
  return join(dir, 'dist/web');
}
