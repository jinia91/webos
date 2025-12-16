import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const pwdCommand: Command = {
  name: 'pwd',
  description: '현재 경로 출력',
  usage: 'pwd',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    return { output: fs.getCurrentPath() };
  },
};

