import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IFileSystem } from '../core/filesystem/IFileSystem';
import './VimEditor.css';

interface VimEditorProps {
  fs: IFileSystem;
  filePath: string;
  onClose: () => void;
  onSave?: (path: string, content: string) => void;
}

type VimMode = 'normal' | 'insert' | 'visual' | 'command';

export const VimEditor: React.FC<VimEditorProps> = ({
  fs,
  filePath,
  onClose,
  onSave,
}) => {
  const [mode, setMode] = useState<VimMode>('normal');
  const [content, setContent] = useState<string[]>(['']);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const [commandLine, setCommandLine] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [undoStack, setUndoStack] = useState<string[][]>([]);
  const [composingText, setComposingText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef({ row: 0, col: 0 });
  const contentRef = useRef<string[]>(['']);
  const isHandlingKeyRef = useRef(false);
  const pendingEnterRef = useRef(false);
  const isComposingRef = useRef(false);

  // 파일 로드
  useEffect(() => {
    const loadFile = async () => {
      try {
        const fileContent = await fs.readFile(filePath);
        const lines = fileContent.split('\n');
        if (lines.length === 0) lines.push('');
        setContent(lines);
        contentRef.current = lines;
        setCursor({ row: 0, col: 0 });
        cursorRef.current = { row: 0, col: 0 };
        saveToUndo();
      } catch (error) {
        setContent(['']);
        contentRef.current = [''];
        setStatusMessage(`새 파일: ${filePath}`);
      }
    };
    loadFile();
  }, [filePath, fs]);

  // content와 cursor를 ref로 동기화
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    isComposingRef.current = isComposing;
  }, [isComposing]);

  const saveToUndo = useCallback(() => {
    setUndoStack(prev => {
      const newStack = [...prev, contentRef.current.map(line => line)];
      return newStack.slice(-50);
    });
  }, []);

  const getCurrentLine = useCallback(() => {
    return contentRef.current[cursorRef.current.row] || '';
  }, []);

  const setCurrentLine = useCallback((line: string) => {
    setContent(prev => {
      const newContent = [...prev];
      newContent[cursorRef.current.row] = line;
      contentRef.current = newContent;
      return newContent;
    });
  }, []);

  const moveCursor = useCallback((row: number, col: number) => {
    setContent(prev => {
      const maxRow = prev.length - 1;
      const maxCol = Math.max(0, (prev[row] || '').length);
      const newRow = Math.max(0, Math.min(row, maxRow));
      const newCol = Math.max(0, Math.min(col, maxCol));
      cursorRef.current = { row: newRow, col: newCol };
      setCursor({ row: newRow, col: newCol });
      return prev;
    });
  }, []);

  const handleNormalKey = useCallback((key: string, e: KeyboardEvent) => {
    e.preventDefault();
    
    const currentCursor = cursorRef.current;
    const currentContent = contentRef.current;
    
    switch (key) {
      case 'i':
        setMode('insert');
        setTimeout(() => hiddenInputRef.current?.focus(), 0);
        break;
      case 'a':
        setMode('insert');
        moveCursor(currentCursor.row, currentCursor.col + 1);
        setTimeout(() => hiddenInputRef.current?.focus(), 0);
        break;
      case 'o':
        setMode('insert');
        saveToUndo();
        const newContent = [...currentContent];
        newContent.splice(currentCursor.row + 1, 0, '');
        setContent(newContent);
        contentRef.current = newContent;
        moveCursor(currentCursor.row + 1, 0);
        setTimeout(() => hiddenInputRef.current?.focus(), 0);
        break;
      case 'O':
        setMode('insert');
        saveToUndo();
        const newContent2 = [...currentContent];
        newContent2.splice(currentCursor.row, 0, '');
        setContent(newContent2);
        contentRef.current = newContent2;
        moveCursor(currentCursor.row, 0);
        setTimeout(() => hiddenInputRef.current?.focus(), 0);
        break;
      case 'h':
        moveCursor(currentCursor.row, currentCursor.col - 1);
        break;
      case 'j':
        moveCursor(currentCursor.row + 1, currentCursor.col);
        break;
      case 'k':
        moveCursor(currentCursor.row - 1, currentCursor.col);
        break;
      case 'l':
        moveCursor(currentCursor.row, currentCursor.col + 1);
        break;
      case 'w': {
        const line = getCurrentLine();
        const nextWord = line.substring(currentCursor.col).match(/^\S*\s*\S*/);
        if (nextWord) {
          moveCursor(currentCursor.row, currentCursor.col + nextWord[0].length);
        } else if (currentCursor.row < currentContent.length - 1) {
          moveCursor(currentCursor.row + 1, 0);
        }
        break;
      }
      case 'b': {
        const line2 = getCurrentLine();
        const beforeCursor = line2.substring(0, currentCursor.col);
        const prevWord = beforeCursor.match(/\S*\s*\S*$/);
        if (prevWord) {
          moveCursor(currentCursor.row, currentCursor.col - prevWord[0].length);
        } else if (currentCursor.row > 0) {
          moveCursor(currentCursor.row - 1, (currentContent[currentCursor.row - 1] || '').length);
        }
        break;
      }
      case '0':
        moveCursor(currentCursor.row, 0);
        break;
      case '$':
        moveCursor(currentCursor.row, getCurrentLine().length);
        break;
      case 'G':
        moveCursor(currentContent.length - 1, currentCursor.col);
        break;
      case 'g':
        if (e.key === 'g' && !e.repeat) {
          setTimeout(() => {
            if (e.key === 'g') {
              moveCursor(0, currentCursor.col);
            }
          }, 300);
        }
        break;
      case 'x': {
        const line3 = getCurrentLine();
        if (currentCursor.col < line3.length) {
          saveToUndo();
          const newLine = line3.slice(0, currentCursor.col) + line3.slice(currentCursor.col + 1);
          setCurrentLine(newLine);
        } else if (currentCursor.row < currentContent.length - 1) {
          saveToUndo();
          const newContent = [...currentContent];
          newContent[currentCursor.row] += newContent[currentCursor.row + 1];
          newContent.splice(currentCursor.row + 1, 1);
          setContent(newContent);
          contentRef.current = newContent;
        }
        break;
      }
      case 'd':
        if (e.key === 'd' && !e.repeat) {
          setTimeout(() => {
            if (e.key === 'd') {
              saveToUndo();
              const newContent = [...contentRef.current];
              newContent.splice(currentCursor.row, 1);
              if (newContent.length === 0) newContent.push('');
              setContent(newContent);
              contentRef.current = newContent;
              moveCursor(Math.min(currentCursor.row, newContent.length - 1), 0);
            }
          }, 300);
        }
        break;
      case 'y':
        if (e.key === 'y' && !e.repeat) {
          setTimeout(() => {
            if (e.key === 'y') {
              navigator.clipboard.writeText(getCurrentLine());
              setStatusMessage('1줄 복사됨');
            }
          }, 300);
        }
        break;
      case 'p':
        navigator.clipboard.readText().then(text => {
          saveToUndo();
          const lines = text.split('\n');
          if (lines.length === 1) {
            const line = getCurrentLine();
            const newLine = line.slice(0, currentCursor.col) + text + line.slice(currentCursor.col);
            setCurrentLine(newLine);
            moveCursor(currentCursor.row, currentCursor.col + text.length);
          } else {
            const newContent = [...contentRef.current];
            const currentLine = newContent[currentCursor.row];
            newContent[currentCursor.row] = currentLine.slice(0, currentCursor.col) + lines[0];
            newContent.splice(currentCursor.row + 1, 0, ...lines.slice(1));
            setContent(newContent);
            contentRef.current = newContent;
            moveCursor(currentCursor.row + lines.length - 1, lines[lines.length - 1].length);
          }
        });
        break;
      case 'u':
        if (undoStack.length > 0) {
          const prevContent = undoStack[undoStack.length - 1];
          setUndoStack(prev => prev.slice(0, -1));
          setContent(prevContent);
          contentRef.current = prevContent;
        }
        break;
      case 'v':
        setMode('visual');
        break;
      case ':':
        setMode('command');
        setCommandLine('');
        setTimeout(() => commandInputRef.current?.focus(), 0);
        break;
      case 'Escape':
        setMode('normal');
        break;
    }
  }, [moveCursor, getCurrentLine, setCurrentLine, saveToUndo, undoStack]);

  const insertText = useCallback((text: string) => {
    if (!text) return;
    
    saveToUndo();
    const currentCursor = cursorRef.current;
    const line = getCurrentLine();
    const newLine = line.slice(0, currentCursor.col) + text + line.slice(currentCursor.col);
    setCurrentLine(newLine);
    moveCursor(currentCursor.row, currentCursor.col + text.length);
  }, [getCurrentLine, setCurrentLine, moveCursor, saveToUndo]);

  const handleCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim();
    const parts = trimmed.split(/\s+/);
    const command = parts[0];

    switch (command) {
      case 'w':
      case 'write':
        try {
          const fileContent = contentRef.current.join('\n');
          await fs.writeFile(filePath, fileContent);
          if (onSave) {
            onSave(filePath, fileContent);
          }
          setStatusMessage(`"${filePath}" ${contentRef.current.length}줄 저장됨`);
        } catch (error) {
          setStatusMessage(`오류: ${error instanceof Error ? error.message : String(error)}`);
        }
        setMode('normal');
        break;
      case 'q':
      case 'quit':
        onClose();
        break;
      case 'wq':
        try {
          const fileContent = contentRef.current.join('\n');
          await fs.writeFile(filePath, fileContent);
          if (onSave) {
            onSave(filePath, fileContent);
          }
          onClose();
        } catch (error) {
          setStatusMessage(`오류: ${error instanceof Error ? error.message : String(error)}`);
          setMode('normal');
        }
        break;
      default:
        setStatusMessage(`알 수 없는 명령: ${command}`);
        setMode('normal');
    }
  }, [filePath, fs, onClose, onSave]);

  // insert 모드일 때 hidden input 포커스
  useEffect(() => {
    if (mode === 'insert' && hiddenInputRef.current) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 0);
    } else if (mode !== 'insert' && hiddenInputRef.current) {
      hiddenInputRef.current.blur();
      hiddenInputRef.current.value = '';
      setComposingText('');
      setIsComposing(false);
    }
  }, [mode]);

  // window keydown 이벤트 (normal 모드와 특수 키만)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 조합 중이면 무시
      if (e.isComposing || isComposingRef.current) {
        return;
      }

      // 이미 hidden input에서 처리 중이면 무시
      if (isHandlingKeyRef.current) {
        return;
      }
      
      // 대기 중인 Enter가 있으면 window 이벤트에서 Enter 처리를 무시
      if (pendingEnterRef.current && e.key === 'Enter') {
        return;
      }

      // hidden input이 포커스를 가지고 있을 때는 특수 키만 처리
      // (일반 텍스트는 hidden input의 input 이벤트에서 처리)
      if (document.activeElement === hiddenInputRef.current && mode === 'insert') {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setMode('normal');
          if (hiddenInputRef.current) {
            hiddenInputRef.current.value = '';
            hiddenInputRef.current.blur();
          }
          setComposingText('');
          setIsComposing(false);
          return;
        }
        // Backspace, Enter, Tab은 hidden input의 keydown에서 처리하므로 여기서는 무시
        if (e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') {
          return;
        }
      }

      if (mode === 'command') {
        if (e.key === 'Escape') {
          setMode('normal');
          setCommandLine('');
        } else if (e.key === 'Enter') {
          handleCommand(commandLine);
          setCommandLine('');
        }
        return;
      }

      if (mode === 'insert') {
        // insert 모드에서는 특수 키만 처리 (텍스트는 hidden input에서)
        // hidden input이 포커스를 가지고 있으면 window 이벤트에서는 처리하지 않음
        if (document.activeElement === hiddenInputRef.current) {
          // hidden input의 keydown 이벤트에서 처리하므로 여기서는 무시
          return;
        }
        
        // 이미 hidden input에서 처리 중이면 무시
        if (isHandlingKeyRef.current) {
          return;
        }
        
        if (e.key === 'Escape') {
          e.preventDefault();
          setMode('normal');
          if (hiddenInputRef.current) {
            hiddenInputRef.current.value = '';
            hiddenInputRef.current.blur();
          }
          setComposingText('');
          setIsComposing(false);
        } else if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Tab') {
          // hidden input이 포커스를 가지고 있으면 window 이벤트에서는 처리하지 않음
          // hidden input의 keydown에서 처리하므로 여기서는 완전히 무시
          if (document.activeElement === hiddenInputRef.current) {
            return;
          }
          
          // 이미 hidden input에서 처리 중이면 무시
          if (isHandlingKeyRef.current) {
            return;
          }
          
          e.preventDefault();
          e.stopPropagation();
          
          const currentCursor = cursorRef.current;
          const currentContent = contentRef.current;
          
          if (e.key === 'Enter') {
            // 조합 중이면 무시 (hidden input에서 처리)
            if (isComposingRef.current) {
              return;
            }
            
            saveToUndo();
            const line = getCurrentLine();
            const beforeCursor = line.slice(0, currentCursor.col);
            const afterCursor = line.slice(currentCursor.col);
            setCurrentLine(beforeCursor);
            const newContent = [...currentContent];
            newContent.splice(currentCursor.row + 1, 0, afterCursor);
            setContent(newContent);
            contentRef.current = newContent;
            moveCursor(currentCursor.row + 1, 0);
            if (hiddenInputRef.current) {
              hiddenInputRef.current.value = '';
            }
            setComposingText('');
            setIsComposing(false);
          } else if (e.key === 'Backspace') {
            // 조합 중이면 무시
            if (isComposingRef.current) {
              return;
            }
            
            if (currentCursor.col > 0) {
              saveToUndo();
              const line = getCurrentLine();
              const newLine = line.slice(0, currentCursor.col - 1) + line.slice(currentCursor.col);
              setCurrentLine(newLine);
              moveCursor(currentCursor.row, currentCursor.col - 1);
            } else if (currentCursor.row > 0) {
              saveToUndo();
              const prevLine = currentContent[currentCursor.row - 1];
              const newContent = [...currentContent];
              newContent[currentCursor.row - 1] = prevLine + getCurrentLine();
              newContent.splice(currentCursor.row, 1);
              setContent(newContent);
              contentRef.current = newContent;
              moveCursor(currentCursor.row - 1, prevLine.length);
            }
            if (hiddenInputRef.current) {
              hiddenInputRef.current.value = '';
            }
            setComposingText('');
            setIsComposing(false);
          } else if (e.key === 'Tab') {
            // 조합 중이면 무시
            if (isComposingRef.current) {
              return;
            }
            
            saveToUndo();
            const line = getCurrentLine();
            const newLine = line.slice(0, currentCursor.col) + '  ' + line.slice(currentCursor.col);
            setCurrentLine(newLine);
            moveCursor(currentCursor.row, currentCursor.col + 2);
            if (hiddenInputRef.current) {
              hiddenInputRef.current.value = '';
            }
            setComposingText('');
            setIsComposing(false);
          }
        }
      } else {
        // normal 모드
        handleNormalKey(e.key, e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, handleNormalKey, handleCommand, commandLine, getCurrentLine, setCurrentLine, moveCursor, saveToUndo]);

  // hidden input 이벤트 처리 (텍스트 입력만)
  useEffect(() => {
    const input = hiddenInputRef.current;
    if (!input) return;

    const handleCompositionStart = () => {
      setIsComposing(true);
      isComposingRef.current = true;
      setComposingText('');
      pendingEnterRef.current = false;
    };

    const handleCompositionUpdate = (e: CompositionEvent) => {
      setComposingText(e.data || '');
    };

    const handleCompositionEnd = (e: CompositionEvent) => {
      setIsComposing(false);
      isComposingRef.current = false;
      
      if (mode === 'insert') {
        // 조합 완료된 텍스트 삽입
        if (e.data) {
          insertText(e.data);
        }
        input.value = '';
        setComposingText('');
        
        // 조합 완료 후 대기 중인 Enter 처리
        if (pendingEnterRef.current) {
          pendingEnterRef.current = false;
          // 플래그 설정하여 중복 처리 방지
          isHandlingKeyRef.current = true;
          // 조합 완료 후 약간의 지연을 두고 Enter 처리
          setTimeout(() => {
            const currentCursor = cursorRef.current;
            const currentContent = contentRef.current;
            saveToUndo();
            const line = getCurrentLine();
            const beforeCursor = line.slice(0, currentCursor.col);
            const afterCursor = line.slice(currentCursor.col);
            setCurrentLine(beforeCursor);
            const newContent = [...currentContent];
            newContent.splice(currentCursor.row + 1, 0, afterCursor);
            setContent(newContent);
            contentRef.current = newContent;
            moveCursor(currentCursor.row + 1, 0);
            input.value = '';
            setComposingText('');
            setIsComposing(false);
            // 플래그 해제
            isHandlingKeyRef.current = false;
          }, 10);
        }
      }
    };

    const handleInput = (e: Event) => {
      if (mode !== 'insert') {
        input.value = '';
        setComposingText('');
        setIsComposing(false);
        return;
      }
      
      // 조합 중이면 무시 (compositionend에서 처리)
      if (isComposing) {
        return;
      }
      
      const target = e.target as HTMLInputElement;
      const newText = target.value;
      
      if (newText) {
        insertText(newText);
        target.value = '';
        setComposingText('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'insert') {
        return;
      }

      // 특수 키는 직접 처리
      if (e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // 플래그 설정하여 window 이벤트에서 중복 처리 방지
        isHandlingKeyRef.current = true;
        
        const currentCursor = cursorRef.current;
        const currentContent = contentRef.current;
        
        if (e.key === 'Backspace') {
          // 조합 중이면 조합 취소만 하고 삭제는 하지 않음
          if (isComposingRef.current) {
            input.value = '';
            setComposingText('');
            setIsComposing(false);
            isComposingRef.current = false;
            isHandlingKeyRef.current = false;
            return;
          }
          
          if (currentCursor.col > 0) {
            saveToUndo();
            const line = getCurrentLine();
            const newLine = line.slice(0, currentCursor.col - 1) + line.slice(currentCursor.col);
            setCurrentLine(newLine);
            moveCursor(currentCursor.row, currentCursor.col - 1);
          } else if (currentCursor.row > 0) {
            saveToUndo();
            const prevLine = currentContent[currentCursor.row - 1];
            const newContent = [...currentContent];
            newContent[currentCursor.row - 1] = prevLine + getCurrentLine();
            newContent.splice(currentCursor.row, 1);
            setContent(newContent);
            contentRef.current = newContent;
            moveCursor(currentCursor.row - 1, prevLine.length);
          }
          input.value = '';
          setComposingText('');
          setIsComposing(false);
        } else if (e.key === 'Enter') {
          // 조합 중이면 Enter 처리를 지연
          if (isComposingRef.current || e.isComposing) {
            // 이미 대기 중이면 무시 (중복 방지)
            if (pendingEnterRef.current) {
              return;
            }
            pendingEnterRef.current = true;
            // 조합 취소하지 않고 그대로 두어 compositionend에서 처리하도록 함
            // input.value를 비우지 않아야 compositionend가 발생함
            setTimeout(() => {
              isHandlingKeyRef.current = false;
            }, 0);
            return;
          }
          
          // 이미 대기 중인 Enter가 있으면 무시 (compositionend에서 처리 중)
          if (pendingEnterRef.current) {
            return;
          }
          
          // 조합이 완료된 상태에서 Enter 처리
          saveToUndo();
          const line = getCurrentLine();
          const beforeCursor = line.slice(0, currentCursor.col);
          const afterCursor = line.slice(currentCursor.col);
          setCurrentLine(beforeCursor);
          const newContent = [...currentContent];
          newContent.splice(currentCursor.row + 1, 0, afterCursor);
          setContent(newContent);
          contentRef.current = newContent;
          moveCursor(currentCursor.row + 1, 0);
          input.value = '';
          setComposingText('');
          setIsComposing(false);
          
          // 플래그 해제
          setTimeout(() => {
            isHandlingKeyRef.current = false;
          }, 0);
        } else if (e.key === 'Tab') {
          // 조합 중이면 조합 취소
          if (isComposingRef.current) {
            input.value = '';
            setComposingText('');
            setIsComposing(false);
            isComposingRef.current = false;
          }
          
          saveToUndo();
          const line = getCurrentLine();
          const newLine = line.slice(0, currentCursor.col) + '  ' + line.slice(currentCursor.col);
          setCurrentLine(newLine);
          moveCursor(currentCursor.row, currentCursor.col + 2);
          input.value = '';
          setComposingText('');
          setIsComposing(false);
          
          // 플래그 해제
          setTimeout(() => {
            isHandlingKeyRef.current = false;
          }, 0);
        }
      }
    };

    input.addEventListener('compositionstart', handleCompositionStart);
    input.addEventListener('compositionupdate', handleCompositionUpdate);
    input.addEventListener('compositionend', handleCompositionEnd);
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeyDown);
    
    return () => {
      input.removeEventListener('compositionstart', handleCompositionStart);
      input.removeEventListener('compositionupdate', handleCompositionUpdate);
      input.removeEventListener('compositionend', handleCompositionEnd);
      input.removeEventListener('input', handleInput);
      input.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, insertText, isComposing]);

  // 현재 줄에 조합 중인 텍스트를 표시하기 위한 헬퍼
  const getDisplayLine = useCallback((lineIndex: number) => {
    if (lineIndex === cursor.row && isComposing && composingText) {
      const line = content[lineIndex] || '';
      const beforeCursor = line.slice(0, cursor.col);
      const afterCursor = line.slice(cursor.col);
      return { before: beforeCursor, composing: composingText, after: afterCursor };
    }
    return { before: content[lineIndex] || '', composing: '', after: '' };
  }, [content, cursor, isComposing, composingText]);

  return (
    <div className="vim-editor" ref={editorRef}>
      <div className="vim-status-bar">
        <span className="vim-mode">{mode.toUpperCase()}</span>
        <span className="vim-file-path">{filePath}</span>
        <span className="vim-cursor-info">
          {cursor.row + 1},{cursor.col + 1}
        </span>
      </div>
      <div className="vim-content">
        {content.map((line, index) => {
          const display = getDisplayLine(index);
          return (
            <div
              key={index}
              className={`vim-line ${index === cursor.row ? 'cursor-line' : ''}`}
            >
              <span className="vim-line-number">{index + 1}</span>
              <span className="vim-line-content">
                {display.composing ? (
                  <>
                    {display.before.split('').map((char, colIndex) => (
                      <span key={colIndex}>
                        {char || ' '}
                      </span>
                    ))}
                    <span className="vim-composing">{display.composing}</span>
                    {display.after.split('').map((char, colIndex) => (
                      <span key={colIndex}>
                        {char || ' '}
                      </span>
                    ))}
                    {index === cursor.row && cursor.col + display.composing.length >= (content[index] || '').length && (
                      <span className="vim-cursor"> </span>
                    )}
                  </>
                ) : (
                  <>
                    {line.split('').map((char, colIndex) => (
                      <span
                        key={colIndex}
                        className={colIndex === cursor.col && index === cursor.row ? 'vim-cursor' : ''}
                      >
                        {char || ' '}
                      </span>
                    ))}
                    {index === cursor.row && cursor.col >= line.length && (
                      <span className="vim-cursor"> </span>
                    )}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {mode === 'command' && (
        <div className="vim-command-line">
          :<input
            ref={commandInputRef}
            type="text"
            value={commandLine}
            onChange={(e) => setCommandLine(e.target.value)}
            className="vim-command-input"
            autoFocus
          />
        </div>
      )}
      {statusMessage && (
        <div className="vim-status-message">{statusMessage}</div>
      )}
      {mode === 'insert' && (
        <input
          ref={hiddenInputRef}
          type="text"
          className="vim-hidden-input"
          autoFocus
        />
      )}
    </div>
  );
};
