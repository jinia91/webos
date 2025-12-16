import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export interface VimCommandContext {
  openVim: (filePath: string) => void;
}

export const createVimCommand = (context: VimCommandContext): Command => ({
  name: 'vim',
  description: 'vim 편집기로 파일 열기',
  usage: 'vim <파일명>',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    try {
      if (args.length === 0) {
        return { output: '', error: '사용법: vim <파일명>' };
      }

      const filePath = args[0];
      
      // 파일 존재 여부 확인 (없으면 새로 생성)
      try {
        await fs.readFile(filePath);
      } catch {
        // 파일이 없으면 빈 파일 생성
        await fs.writeFile(filePath, '');
      }

      // vim 편집기 열기
      context.openVim(filePath);
      
      return { output: '' };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

