import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export const mkdirCommand: Command = {
  name: 'mkdir',
  description: '디렉토리 생성',
  usage: 'mkdir <경로>',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    try {
      if (args.length === 0) {
        return { output: '', error: '사용법: mkdir <디렉토리명>' };
      }
      const mkdirResult = fs.mkdir(args[0]);
      if (mkdirResult instanceof Promise) {
        await mkdirResult;
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

