// CLI 명령어 처리 시스템

import { FileSystem } from './FileSystem';

export interface CommandResult {
  output: string;
  error?: string;
}

export class CLI {
  private fs: FileSystem;
  private history: string[] = [];
  private historyIndex: number = -1;

  constructor(fs: FileSystem) {
    this.fs = fs;
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

  execute(command: string): CommandResult {
    const trimmed = command.trim();
    if (!trimmed) {
      return { output: '' };
    }

    this.addToHistory(trimmed);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (cmd) {
        case 'ls':
          return this.handleLs(args);
        case 'cd':
          return this.handleCd(args);
        case 'pwd':
          return this.handlePwd();
        case 'mkdir':
          return this.handleMkdir(args);
        case 'cat':
          return this.handleCat(args);
        case 'echo':
          return this.handleEcho(args);
        case 'touch':
          return this.handleTouch(args);
        case 'rm':
          return this.handleRm(args);
        case 'clear':
        case 'cls':
          return { output: 'CLEAR' };
        case 'help':
          return this.handleHelp();
        case 'whoami':
          return { output: 'user' };
        case 'date':
          return { output: new Date().toLocaleString('ko-KR') };
        case 'history':
          return this.handleHistory();
        default:
          return { output: '', error: `명령을 찾을 수 없습니다: ${cmd}. 'help'를 입력하여 사용 가능한 명령을 확인하세요.` };
      }
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private handleLs(args: string[]): CommandResult {
    const path = args[0];
    const files = this.fs.ls(path);
    const output = files
      .map(f => (f.type === 'directory' ? `📁 ${f.name}/` : `📄 ${f.name}`))
      .join('\n');
    return { output };
  }

  private handleCd(args: string[]): CommandResult {
    if (args.length === 0) {
      this.fs.cd('/home/user');
      return { output: '' };
    }
    this.fs.cd(args[0]);
    return { output: '' };
  }

  private handlePwd(): CommandResult {
    return { output: this.fs.getCurrentPath() };
  }

  private handleMkdir(args: string[]): CommandResult {
    if (args.length === 0) {
      return { output: '', error: '사용법: mkdir <디렉토리명>' };
    }
    this.fs.mkdir(args[0]);
    return { output: '' };
  }

  private handleCat(args: string[]): CommandResult {
    if (args.length === 0) {
      return { output: '', error: '사용법: cat <파일명>' };
    }
    const content = this.fs.cat(args[0]);
    return { output: content };
  }

  private handleEcho(args: string[]): CommandResult {
    return { output: args.join(' ') };
  }

  private handleTouch(args: string[]): CommandResult {
    if (args.length === 0) {
      return { output: '', error: '사용법: touch <파일명>' };
    }
    this.fs.writeFile(args[0], '');
    return { output: '' };
  }

  private handleRm(args: string[]): CommandResult {
    if (args.length === 0) {
      return { output: '', error: '사용법: rm [-r] <파일/디렉토리명>' };
    }
    const recursive = args[0] === '-r' || args[0] === '-R';
    const path = recursive ? args[1] : args[0];
    if (!path) {
      return { output: '', error: '사용법: rm [-r] <파일/디렉토리명>' };
    }
    this.fs.rm(path, recursive);
    return { output: '' };
  }

  private handleHelp(): CommandResult {
    const helpText = `
사용 가능한 명령어:

  ls [경로]          - 현재 디렉토리 내용 나열
  cd [경로]          - 디렉토리 변경
  pwd                - 현재 경로 출력
  mkdir <경로>       - 디렉토리 생성
  cat <파일>         - 파일 내용 출력
  echo <텍스트>      - 텍스트 출력
  touch <파일>       - 빈 파일 생성
  rm [-r] <경로>     - 파일/디렉토리 삭제
  clear / cls        - 화면 지우기
  whoami             - 현재 사용자 출력
  date               - 현재 날짜/시간 출력
  history            - 명령어 히스토리 출력
  help               - 이 도움말 출력
`;
    return { output: helpText.trim() };
  }

  private handleHistory(): CommandResult {
    const output = this.history
      .map((cmd, index) => `${index + 1}  ${cmd}`)
      .join('\n');
    return { output };
  }
}

