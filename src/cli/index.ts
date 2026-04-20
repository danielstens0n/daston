import { Command } from 'commander';
import { init } from './commands/init.ts';
import { start } from './commands/start.ts';

export function run(argv: string[]): void {
  const program = new Command();
  program.name('daston').description('Visual design theme companion for terminal coding agents');

  program
    .command('init')
    .description('Initialize daston in the target project')
    .option('--project <path>', 'Host project directory (defaults to automatic resolution)')
    .action(init);

  program
    .command('start')
    .description('Start the local server and print the canvas URL')
    .option('--project <path>', 'Host project directory (defaults to automatic resolution)')
    .action(start);

  program.parse(argv);
}
