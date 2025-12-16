import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const echoCommand: Command = {
  name: 'echo',
  description: '텍스트 출력',
  usage: 'echo <텍스트>',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    return { output: args.join(' ') };
  },
};

