import { Command, CommandResult } from './types';

export const dateCommand: Command = {
  name: 'date',
  description: '현재 날짜/시간 출력',
  usage: 'date',
  execute: (): CommandResult => {
    return { output: new Date().toLocaleString('ko-KR') };
  },
};

