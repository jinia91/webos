import { Command, CommandResult } from './types';
import { IFileSystem } from '../filesystem/IFileSystem';

export const nodeCommand: Command = {
  name: 'node',
  aliases: ['js'],
  description: 'JavaScript 파일 실행',
  usage: 'node <파일> [인자...]',
  execute: async (fs: IFileSystem, args: string[]): Promise<CommandResult> => {
    try {
      if (args.length === 0) {
        return { output: '', error: '사용법: node <파일명> [인자...]' };
      }

      const filePath = args[0];
      const scriptArgs = args.slice(1);

      // 파일 읽기
      const contentResult = fs.readFile(filePath);
      const content = contentResult instanceof Promise ? await contentResult : contentResult;

      // 출력 캡처를 위한 배열
      const outputs: string[] = [];
      const errors: string[] = [];

      // console 오버라이드
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
      };

      // 출력 캡처 함수
      const captureOutput = (args: any[]) => {
        return args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
      };

      // console 오버라이드
      console.log = (...args: any[]) => {
        outputs.push(captureOutput(args));
        originalConsole.log(...args);
      };

      console.error = (...args: any[]) => {
        errors.push(captureOutput(args));
        originalConsole.error(...args);
      };

      console.warn = (...args: any[]) => {
        outputs.push(`[WARN] ${captureOutput(args)}`);
        originalConsole.warn(...args);
      };

      console.info = (...args: any[]) => {
        outputs.push(`[INFO] ${captureOutput(args)}`);
        originalConsole.info(...args);
      };

      console.debug = (...args: any[]) => {
        outputs.push(`[DEBUG] ${captureOutput(args)}`);
        originalConsole.debug(...args);
      };

      try {
        // process 객체 시뮬레이션 (Node.js 호환성)
        const process = {
          argv: ['node', filePath, ...scriptArgs],
          env: {} as Record<string, string>,
          exit: (code?: number) => {
            throw new Error(`Process exited with code ${code || 0}`);
          },
        };

        // 전역 변수로 process 설정 (브라우저 환경)
        if (typeof window !== 'undefined') {
          (window as any).process = process;
        } else if (typeof global !== 'undefined') {
          (global as any).process = process;
        }

        // 스크립트 실행
        // new Function을 사용하여 스코프를 제어하고 에러 처리를 개선
        const scriptFunction = new Function(
          'console',
          'process',
          content
        );

        // Promise 반환값 처리
        const result = scriptFunction(console, process);
        
        // Promise인 경우 처리
        if (result instanceof Promise) {
          await result;
        }

        // console 복원
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
        console.debug = originalConsole.debug;

        // process 제거
        if (typeof window !== 'undefined') {
          delete (window as any).process;
        } else if (typeof global !== 'undefined') {
          delete (global as any).process;
        }

        // 출력 결합
        const allOutputs = [...outputs];
        if (errors.length > 0) {
          allOutputs.push(...errors.map(e => `[ERROR] ${e}`));
        }

        return {
          output: allOutputs.join('\n') || '',
          error: errors.length > 0 ? undefined : undefined,
        };
      } catch (error) {
        // console 복원
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
        console.debug = originalConsole.debug;

        // process 제거
        if (typeof window !== 'undefined') {
          delete (window as any).process;
        } else if (typeof global !== 'undefined') {
          delete (global as any).process;
        }

        return {
          output: outputs.length > 0 ? outputs.join('\n') : '',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

