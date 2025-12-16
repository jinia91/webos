// CLI 명령어 처리 시스템

import { IFileSystem } from './filesystem/IFileSystem';
import { Command, CommandResult } from './commands/types';
import {
  lsCommand,
  cdCommand,
  pwdCommand,
  mkdirCommand,
  catCommand,
  echoCommand,
  touchCommand,
  rmCommand,
  clearCommand,
  whoamiCommand,
  dateCommand,
  createHistoryCommand,
  createHelpCommand,
  createVimCommand,
  nodeCommand,
} from './commands';

export type { CommandResult } from './commands/types';

export interface VimCommandContext {
  openVim: (filePath: string) => void;
}

export class CLI {
  private fs: IFileSystem;
  private history: string[] = [];
  private historyIndex: number = -1;
  private commands: Map<string, Command> = new Map();
  private vimContext?: VimCommandContext;

  constructor(fs: IFileSystem, vimContext?: VimCommandContext) {
    this.fs = fs;
    this.vimContext = vimContext;
    this.initializeCommands();
  }

  setVimContext(context: VimCommandContext): void {
    this.vimContext = context;
    // vim 명령어 재등록
    if (this.vimContext) {
      const vimCommand = createVimCommand(this.vimContext);
      this.commands.set(vimCommand.name, vimCommand);
    }
  }

  private initializeCommands(): void {
    // 기본 명령어 등록
    const baseCommands: Command[] = [
      lsCommand,
      cdCommand,
      pwdCommand,
      mkdirCommand,
      catCommand,
      echoCommand,
      touchCommand,
      rmCommand,
      clearCommand,
      whoamiCommand,
      dateCommand,
      nodeCommand,
    ];

    // 기본 명령어 등록
    baseCommands.forEach(cmd => {
      this.commands.set(cmd.name, cmd);
      // 별칭도 등록
      if (cmd.aliases) {
        cmd.aliases.forEach(alias => {
          this.commands.set(alias, cmd);
        });
      }
    });

    // 컨텍스트가 필요한 명령어 등록
    const historyCommand = createHistoryCommand({
      getHistory: () => this.history,
    });
    this.commands.set(historyCommand.name, historyCommand);

    const helpCommand = createHelpCommand({
      getCommands: () => Array.from(this.commands.values()).filter((cmd, index, self) => 
        self.findIndex(c => c.name === cmd.name) === index
      ),
    });
    this.commands.set(helpCommand.name, helpCommand);

    // vim 명령어 등록
    if (this.vimContext) {
      const vimCommand = createVimCommand(this.vimContext);
      this.commands.set(vimCommand.name, vimCommand);
    }
  }

  getHistory(): string[] {
    return this.history;
  }

  addToHistory(command: string): void {
    this.history.push(command);
    this.historyIndex = this.history.length;
  }

  getHistoryItem(direction: 'up' | 'down'): string | null {
    if (direction === 'up') {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        return this.history[this.historyIndex];
      }
    } else {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        return this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        return '';
      }
    }
    return null;
  }

  async execute(command: string): Promise<CommandResult> {
    const trimmed = command.trim();
    if (!trimmed) {
      return { output: '' };
    }

    this.addToHistory(trimmed);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const commandHandler = this.commands.get(cmd);
    if (!commandHandler) {
      return {
        output: '',
        error: `명령을 찾을 수 없습니다: ${cmd}. 'help'를 입력하여 사용 가능한 명령을 확인하세요.`,
      };
    }

    try {
      const result = commandHandler.execute(this.fs, args);
      // Promise인 경우 await, 아닌 경우 그대로 반환
      return result instanceof Promise ? await result : result;
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

