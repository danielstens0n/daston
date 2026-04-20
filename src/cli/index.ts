import { Command } from 'commander';
import { init } from './commands/init.ts';
import { inspect } from './commands/inspect.ts';
import { promptAddComponent, promptApplyTheme } from './commands/prompt.ts';
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

  program
    .command('inspect')
    .description('Inspect the resolved target project and detected theme data')
    .option('--project <path>', 'Host project directory (defaults to automatic resolution)')
    .option('--json', 'Print machine-readable JSON')
    .action(inspect);

  const prompt = program.command('prompt').description('Generate prompts for coding agents');

  prompt
    .command('apply-theme')
    .description('Generate a prompt that applies the current theme to the project')
    .option('--project <path>', 'Host project directory (defaults to automatic resolution)')
    .option('--json', 'Print machine-readable JSON')
    .action(promptApplyTheme);

  prompt
    .command('add-component')
    .description('Generate a prompt that adds a stock component to the project')
    .requiredOption('--component <id>', 'Stock component id')
    .option('--project <path>', 'Host project directory (defaults to automatic resolution)')
    .option('--json', 'Print machine-readable JSON')
    .action(promptAddComponent);

  program.parse(argv);
}
