import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export interface HelpCommandContext {
  getCommands: () => Command[];
}

export const createHelpCommand = (context: HelpCommandContext): Command => ({
  name: 'help',
  description: '도움말 출력',
  usage: 'help',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    const commands = context.getCommands();
    const helpLines = commands.map(cmd => {
      const aliases = cmd.aliases ? ` / ${cmd.aliases.join(' / ')}` : '';
      const nameWithAliases = `${cmd.name}${aliases}`;
      const padding = ' '.repeat(Math.max(1, 20 - nameWithAliases.length));
      return `  ${nameWithAliases}${padding}- ${cmd.description}`;
    });
    
    const helpText = `
사용 가능한 명령어:

${helpLines.join('\n')}
`;
    return { output: helpText.trim() };
  },
});

