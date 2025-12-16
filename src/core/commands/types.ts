// 명령어 인터페이스 정의

import { IFileSystem } from '../filesystem/IFileSystem';

export interface CommandResult {
  output: string;
  error?: string;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  execute: (fs: IFileSystem, args: string[]) => CommandResult | Promise<CommandResult>;
}

