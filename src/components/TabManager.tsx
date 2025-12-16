import React, { useState, useCallback } from 'react';
import { Terminal } from './Terminal';
import { FileSystem } from '../core/FileSystem';
import { CLI } from '../core/CLI';
import './TabManager.css';

interface Tab {
  id: string;
  name: string;
  fs: FileSystem;
  cli: CLI;
}

export const TabManager: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    // 초기 탭 생성
    const initialFs = new FileSystem();
    const initialCli = new CLI(initialFs);
    return [{
      id: '1',
      name: 'Terminal',
      fs: initialFs,
      cli: initialCli,
    }];
  });
  const [activeTabId, setActiveTabId] = useState<string>('1');

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  const handleAddTab = useCallback(() => {
    const newFs = new FileSystem();
    const newCli = new CLI(newFs);
    const newTab: Tab = {
      id: Date.now().toString(),
      name: 'Terminal',
      fs: newFs,
      cli: newCli,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
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
            <Terminal fs={tab.fs} cli={tab.cli} />
          </div>
        ))}
      </div>
    </div>
  );
};

