import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const clearCommand: Command = {
  name: 'clear',
  aliases: ['cls'],
  description: '화면 지우기',
  usage: 'clear / cls',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    return { output: 'CLEAR' };
  },
};

