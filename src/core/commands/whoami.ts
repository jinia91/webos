import { Command, CommandResult } from './types';

export const whoamiCommand: Command = {
  name: 'whoami',
  description: '현재 사용자 출력',
  usage: 'whoami',
  execute: (): CommandResult => {
    return { output: 'user' };
  },
};

