import { Command, CommandResult } from './types';

export const clearCommand: Command = {
  name: 'clear',
  aliases: ['cls'],
  description: '화면 지우기',
  usage: 'clear / cls',
  execute: (): CommandResult => {
    return { output: 'CLEAR' };
  },
};

