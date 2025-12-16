import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export const lsCommand: Command = {
  name: 'ls',
  description: '현재 디렉토리 내용 나열',
  usage: 'ls [경로]',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    try {
      const path = args[0];
      const filesResult = fs.ls(path);
      const files = filesResult instanceof Promise ? await filesResult : filesResult;
      const output = files
        .map(f => (f.type === 'directory' ? `📁 ${f.name}/` : `📄 ${f.name}`))
        .join('\n');
      return { output };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

