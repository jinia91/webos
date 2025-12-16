import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const rmCommand: Command = {
  name: 'rm',
  description: '파일/디렉토리 삭제',
  usage: 'rm [-r] <경로>',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    try {
      if (args.length === 0) {
        return { output: '', error: '사용법: rm [-r] <파일/디렉토리명>' };
      }
      const recursive = args[0] === '-r' || args[0] === '-R';
      const path = recursive ? args[1] : args[0];
      if (!path) {
        return { output: '', error: '사용법: rm [-r] <파일/디렉토리명>' };
      }
      fs.rm(path, recursive);
      return { output: '' };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

