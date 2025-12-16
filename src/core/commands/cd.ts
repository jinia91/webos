import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const cdCommand: Command = {
  name: 'cd',
  description: '디렉토리 변경',
  usage: 'cd [경로]',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    try {
      if (args.length === 0) {
        fs.cd('/home/user');
        return { output: '' };
      }
      fs.cd(args[0]);
      return { output: '' };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

