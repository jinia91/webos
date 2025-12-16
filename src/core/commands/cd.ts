import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export const cdCommand: Command = {
  name: 'cd',
  description: '디렉토리 변경',
  usage: 'cd [경로]',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    try {
      if (args.length === 0) {
        const cdResult = fs.cd('/home/user');
        if (cdResult instanceof Promise) {
          await cdResult;
        }
        return { output: '' };
      }
      const cdResult = fs.cd(args[0]);
      if (cdResult instanceof Promise) {
        await cdResult;
      }
      return { output: '' };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

