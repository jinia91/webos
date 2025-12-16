import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export interface HistoryCommandContext {
  getHistory: () => string[];
}

export const createHistoryCommand = (context: HistoryCommandContext): Command => ({
  name: 'history',
  description: '명령어 히스토리 출력',
  usage: 'history',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    const history = context.getHistory();
    const output = history
      .map((cmd, index) => `${index + 1}  ${cmd}`)
      .join('\n');
    return { output };
  },
});

