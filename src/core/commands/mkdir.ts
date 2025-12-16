import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const mkdirCommand: Command = {
  name: 'mkdir',
  description: '디렉토리 생성',
  usage: 'mkdir <경로>',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    try {
      if (args.length === 0) {
        return { output: '', error: '사용법: mkdir <디렉토리명>' };
      }
      fs.mkdir(args[0]);
      return { output: '' };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

