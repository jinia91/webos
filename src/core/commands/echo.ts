import { Command, CommandResult } from './types';

export const echoCommand: Command = {
  name: 'echo',
  description: '텍스트 출력',
  usage: 'echo <텍스트>',
  execute: (_fs, args: string[]): CommandResult => {
    return { output: args.join(' ') };
  },
};

