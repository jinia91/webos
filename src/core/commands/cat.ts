import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export const catCommand: Command = {
  name: 'cat',
  description: '파일 내용 출력',
  usage: 'cat <파일>',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    try {
      if (args.length === 0) {
        return { output: '', error: '사용법: cat <파일명>' };
      }
      const contentResult = fs.cat(args[0]);
      const content = contentResult instanceof Promise ? await contentResult : contentResult;
      return { output: content };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

