import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export interface HistoryCommandContext {
  getHistory: () => string[];
}

export const createHistoryCommand = (context: HistoryCommandContext): Command => ({
  name: 'history',
  description: '명령어 히스토리 출력',
  usage: 'history',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    const history = context.getHistory();
    const output = history
      .map((cmd, index) => `${index + 1}  ${cmd}`)
      .join('\n');
    return { output };
  },
});

