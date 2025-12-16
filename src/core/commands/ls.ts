import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const lsCommand: Command = {
  name: 'ls',
  description: '현재 디렉토리 내용 나열',
  usage: 'ls [경로]',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    try {
      const path = args[0];
      const files = fs.ls(path);
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

