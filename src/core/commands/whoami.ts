import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const whoamiCommand: Command = {
  name: 'whoami',
  description: '현재 사용자 출력',
  usage: 'whoami',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    return { output: 'user' };
  },
};

