import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const catCommand: Command = {
  name: 'cat',
  description: '파일 내용 출력',
  usage: 'cat <파일>',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    try {
      if (args.length === 0) {
        return { output: '', error: '사용법: cat <파일명>' };
      }
      const content = fs.cat(args[0]);
      return { output: content };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

