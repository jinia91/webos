import { Command, CommandResult } from './types';
import { FileSystem } from '../FileSystem';

export const dateCommand: Command = {
  name: 'date',
  description: '현재 날짜/시간 출력',
  usage: 'date',
  execute: (fs: FileSystem, args: string[]): CommandResult => {
    return { output: new Date().toLocaleString('ko-KR') };
  },
};

