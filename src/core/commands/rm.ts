import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export const rmCommand: Command = {
  name: 'rm',
  description: '파일/디렉토리 삭제',
  usage: 'rm [-r] <경로>',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    try {
      if (args.length === 0) {
        return { output: '', error: '사용법: rm [-r] <파일/디렉토리명>' };
      }
      const recursive = args[0] === '-r' || args[0] === '-R';
      const path = recursive ? args[1] : args[0];
      if (!path) {
        return { output: '', error: '사용법: rm [-r] <파일/디렉토리명>' };
      }
      const rmResult = fs.rm(path, recursive);
      if (rmResult instanceof Promise) {
        await rmResult;
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

