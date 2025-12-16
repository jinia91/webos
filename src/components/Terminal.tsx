import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CLI, CommandResult } from '../core/CLI';
import { IFileSystem } from '../core/filesystem/IFileSystem';
import './Terminal.css';

interface TerminalProps {
  fs: IFileSystem;
  cli: CLI;
  onPathChange?: (path: string) => void;
}

interface OutputItem {
  type: 'command' | 'output' | 'error';
  content: string;
  path?: string;
  command?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ fs, cli, onPathChange }) => {
  const [output, setOutput] = useState<Array<OutputItem>>([
    { type: 'output', content: 'WebOS 터미널에 오신 것을 환영합니다!\n\'help\'를 입력하여 사용 가능한 명령어를 확인하세요.\n' },
  ]);
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState<string>('/');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePath = async () => {
      const pathResult = fs.getCurrentPath();
      const path = pathResult instanceof Promise 
        ? await pathResult 
        : pathResult;
      setCurrentPath(path);
      onPathChange?.(path);
    };
    updatePath();
  }, [fs, onPathChange]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      return;
    }

    const command = input.trim();
    const currentPathResult = fs.getCurrentPath();
    const currentPathForCommand = currentPathResult instanceof Promise 
      ? await currentPathResult 
      : currentPathResult;
    
    // 명령어 출력 추가 (경로와 명령어 분리 저장)
    setOutput(prev => [...prev, { 
      type: 'command', 
      content: `user@webos:${currentPathForCommand}$ ${command}`,
      path: currentPathForCommand,
      command: command
    }]);

    // 명령어 실행
    const result: CommandResult = await cli.execute(command);

    // clear 명령어 처리
    if (result.output === 'CLEAR') {
      setOutput([]);
      setInput('');
      return;
    }

    // 결과 출력 추가
    if (result.error) {
      setOutput(prev => [...prev, { type: 'error', content: result.error! }]);
    } else if (result.output) {
      setOutput(prev => [...prev, { type: 'output', content: result.output }]);
    }

    // 경로 업데이트
    const newPathResult = fs.getCurrentPath();
    const newPath = newPathResult instanceof Promise 
      ? await newPathResult 
      : newPathResult;
    setCurrentPath(newPath);
    onPathChange?.(newPath);
    setInput('');
  }, [input, cli, fs, onPathChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const historyItem = cli.getHistoryItem('up');
      if (historyItem !== null) {
        setInput(historyItem);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const historyItem = cli.getHistoryItem('down');
      if (historyItem !== null) {
        setInput(historyItem);
      }
    }
  }, [cli]);

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="terminal-container" onClick={handleContainerClick}>
      <div className="terminal-body" onClick={handleContainerClick}>
        <div className="terminal-output" ref={outputRef} onClick={handleContainerClick}>
          {output.map((item, index) => (
            <div key={index} className={`terminal-line ${item.type}`}>
              {item.type === 'command' ? (
                <span className="command-prompt">
                  <span className="user">user</span>
                  <span className="at">@</span>
                  <span className="host">webos</span>
                  <span className="path">:{item.path || ''}</span>
                  <span className="symbol">$ </span>
                  <span className="command-text">{item.command || ''}</span>
                </span>
              ) : item.type === 'error' ? (
                <span className="error-text">{item.content}</span>
              ) : (
                <span className="output-text">{item.content}</span>
              )}
            </div>
          ))}
          <form onSubmit={handleSubmit} className="terminal-input-form">
            <span className="prompt">
              <span className="user">user</span>
              <span className="at">@</span>
              <span className="host">webos</span>
              <span className="path">:{currentPath}</span>
              <span className="symbol">$ </span>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="terminal-input"
              autoFocus
            />
          </form>
        </div>
      </div>
    </div>
  );
};

