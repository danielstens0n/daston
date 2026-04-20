import { Command, InvalidArgumentError } from 'commander';
import { start } from './start.ts';

export function run(argv: string[]): void {
  const program = new Command();

  program
    .name('daston')
    .description(
      'Launch the local Daston design canvas. Boots a localhost server against the current project, prints its URL, and opens the canvas in the default browser.',
    )
    .option('--project <path>', 'Target a specific app directory (defaults to automatic resolution)')
    .option('--port <number>', 'Pin a port instead of the default dynamic pick', parsePort)
    .option('--no-open', 'Print the URL but do not auto-open the browser')
    .action(start);

  program.parse(argv);
}

function parsePort(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new InvalidArgumentError(`${value} is not an integer between 1 and 65535.`);
  }
  return parsed;
}
