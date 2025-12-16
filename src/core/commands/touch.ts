import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const touchCommand: Command = {
  name: 'touch',
  description: '빈 파일 생성',
  usage: 'touch <파일>',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    try {
      if (args.length === 0) {
        return { output: '', error: '사용법: touch <파일명>' };
      }
      fs.writeFile(args[0], '');
      return { output: '' };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

