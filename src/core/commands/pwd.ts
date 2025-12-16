import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export const pwdCommand: Command = {
  name: 'pwd',
  description: '현재 경로 출력',
  usage: 'pwd',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    const pathResult = fs.getCurrentPath();
    const path = pathResult instanceof Promise ? await pathResult : pathResult;
    return { output: path };
  },
};

