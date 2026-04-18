import { Command } from 'commander';
import { init } from './commands/init.ts';
import { start } from './commands/start.ts';

export function run(argv: string[]): void {
  const program = new Command();
  program.name('daston').description('Visual design theme companion for terminal coding agents');

  program.command('init').description('Initialize daston in the current folder').action(init);
  program.command('start').description('Start the local server and open the canvas').action(start);

  program.parse(argv);
}
