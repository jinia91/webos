import React, { useState, useCallback } from 'react';
import { Terminal } from './Terminal';
import { FileExplorer } from './FileExplorer';
import { VimEditor } from './VimEditor';
import { MemoryFileSystem, IFileSystem } from '../core/filesystem';
import { CLI } from '../core/CLI';
import './TabManager.css';

interface Tab {
  id: string;
  name: string;
  fs: IFileSystem;
  cli: CLI;
}

interface VimSession {
  filePath: string;
  tabId: string;
}

export const TabManager: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    // 초기 탭 생성
    const initialFs = new MemoryFileSystem();
    const initialCli = new CLI(initialFs);
    return [{
      id: '1',
      name: 'Terminal',
      fs: initialFs,
      cli: initialCli,
    }];
  });

  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [currentPaths, setCurrentPaths] = useState<Record<string, string>>({ '1': '/' });
  const [vimSessions, setVimSessions] = useState<Record<string, VimSession | null>>({});

  const handleAddTab = useCallback(() => {
    const newFs = new MemoryFileSystem();
    const newCli = new CLI(newFs);
    const newTabId = Date.now().toString();
    const newTab: Tab = {
      id: newTabId,
      name: 'Terminal',
      fs: newFs,
      cli: newCli,
    };
    setTabs(prev => [...prev, newTab]);
    setCurrentPaths(prev => ({ ...prev, [newTabId]: '/' }));
    setActiveTabId(newTabId);
  }, []);

  const handleCloseTab = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // 마지막 탭은 닫을 수 없음
      return;
    }
    
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      // 닫힌 탭이 활성 탭이었다면 다른 탭으로 전환
      if (tabId === activeTabId) {
        const closedIndex = prev.findIndex(tab => tab.id === tabId);
        const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
        setActiveTabId(newTabs[newActiveIndex]?.id || newTabs[0]?.id);
      }
      return newTabs;
    });
  }, [tabs.length, activeTabId]);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleOpenVim = useCallback((tabId: string, filePath: string) => {
    setVimSessions(prev => ({
      ...prev,
      [tabId]: { filePath, tabId },
    }));
  }, []);

  const handleCloseVim = useCallback((tabId: string) => {
    setVimSessions(prev => ({
      ...prev,
      [tabId]: null,
    }));
  }, []);

  const handleVimSave = useCallback(async (tabId: string, filePath: string, content: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      const writeResult = tab.fs.writeFile(filePath, content);
      if (writeResult instanceof Promise) {
        await writeResult;
      }
    }
  }, [tabs]);

  // vim 컨텍스트 설정
  React.useEffect(() => {
    tabs.forEach(tab => {
      tab.cli.setVimContext({
        openVim: (filePath: string) => handleOpenVim(tab.id, filePath),
      });
    });
  }, [tabs, handleOpenVim]);

  return (
    <div className="tab-manager">
      <div className="tab-bar">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="tab-name">{tab.name}</span>
            {tabs.length > 1 && (
              <button
                className="tab-close"
                onClick={(e) => handleCloseTab(tab.id, e)}
                aria-label="탭 닫기"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="tab-add" onClick={handleAddTab} aria-label="새 탭 추가">
          +
        </button>
      </div>
      <div className="tab-content">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`terminal-wrapper ${tab.id === activeTabId ? 'active' : ''}`}
          >
            {vimSessions[tab.id] ? (
              <VimEditor
                fs={tab.fs}
                filePath={vimSessions[tab.id]!.filePath}
                onClose={() => handleCloseVim(tab.id)}
                onSave={(path, content) => handleVimSave(tab.id, path, content)}
              />
            ) : (
              <div className="main-content">
                <Terminal 
                  fs={tab.fs} 
                  cli={tab.cli}
                  onPathChange={(path) => {
                    setCurrentPaths(prev => ({ ...prev, [tab.id]: path }));
                  }}
                />
                <FileExplorer
                  fs={tab.fs}
                  currentPath={currentPaths[tab.id] || '/'}
                  onPathChange={async (path: string) => {
                    const cdResult = tab.fs.cd(path);
                    if (cdResult instanceof Promise) {
                      await cdResult;
                    }
                    const newPathResult = tab.fs.getCurrentPath();
                    const newPath = newPathResult instanceof Promise 
                      ? await newPathResult 
                      : newPathResult;
                    setCurrentPaths(prev => ({ ...prev, [tab.id]: newPath }));
                    // 터미널에 cd 명령 실행
                    await tab.cli.execute(`cd ${path}`);
                  }}
                  onFileOpen={async (path: string) => {
                    // 터미널에 cat 명령 실행
                    await tab.cli.execute(`cat ${path}`);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

