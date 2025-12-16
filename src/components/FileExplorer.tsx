import React, { useState, useEffect, useCallback } from 'react';
import { IFileSystem, FileNode } from '../core/filesystem/IFileSystem';
import './FileExplorer.css';

interface FileExplorerProps {
  fs: IFileSystem;
  currentPath: string;
  onPathChange: (path: string) => void;
  onFileOpen: (path: string) => void;
}

interface TreeNode extends FileNode {
  fullPath: string;
  expanded?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  fs,
  currentPath,
  onPathChange,
  onFileOpen,
}) => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));

  // 초기 트리 로드
  useEffect(() => {
    const loadTree = async () => {
      try {
        const rootNodesResult = fs.ls('/');
        const rootNodes = rootNodesResult instanceof Promise 
          ? await rootNodesResult 
          : rootNodesResult;
        const treeNodes = rootNodes.map(node => ({
          ...node,
          fullPath: `/${node.name}`,
          expanded: expandedPaths.has(`/${node.name}`),
          children: [],
        }));
        setTree(treeNodes);
      } catch (error) {
        console.error('Failed to load file tree:', error);
      }
    };
    loadTree();
  }, [fs]);

  // 현재 경로 변경 시 자동 확장 및 로드
  useEffect(() => {
    const expandAndLoadPath = async () => {
      if (currentPath === '/') {
        setExpandedPaths(prev => {
          const newSet = new Set(prev);
          newSet.add('/');
          return newSet;
        });
        return;
      }

      const segments = currentPath.split('/').filter(s => s !== '');
      const pathsToExpand = new Set<string>(['/']);
      let currentPathStr = '';
      
      // 확장할 경로들 수집
      for (const segment of segments) {
        currentPathStr = currentPathStr ? `${currentPathStr}/${segment}` : `/${segment}`;
        pathsToExpand.add(currentPathStr);
      }
      
      // expandedPaths 업데이트
      setExpandedPaths(prev => {
        const newSet = new Set(prev);
        pathsToExpand.forEach(p => newSet.add(p));
        return newSet;
      });

      // 트리 재귀적으로 로드
      const loadPathRecursively = async (nodes: TreeNode[], targetPath: string): Promise<TreeNode[]> => {
        return Promise.all(nodes.map(async (node) => {
          const nodePath = node.fullPath;
          
          // 현재 경로까지의 경로인지 확인 (현재 경로 포함)
          // nodePath가 targetPath의 부모 경로이거나 targetPath와 같아야 함
          const isOnPath = targetPath === nodePath || targetPath.startsWith(nodePath + '/');
          
          if (isOnPath && node.type === 'directory') {
            // 이 노드의 자식들을 로드해야 함
            if (pathsToExpand.has(nodePath)) {
              // 자식이 없거나 로드되지 않은 경우에만 로드
              if (!node.children || node.children.length === 0) {
                const childrenResult = fs.ls(nodePath);
                const children = childrenResult instanceof Promise 
                  ? await childrenResult 
                  : childrenResult;
                
                const childNodes = children.map(child => ({
                  ...child,
                  fullPath: nodePath === '/' 
                    ? `/${child.name}` 
                    : `${nodePath}/${child.name}`,
                  expanded: pathsToExpand.has(
                    nodePath === '/' 
                      ? `/${child.name}` 
                      : `${nodePath}/${child.name}`
                  ),
                  children: child.type === 'directory' ? [] : undefined,
                }));

                // 자식들도 재귀적으로 로드
                const loadedChildren = await loadPathRecursively(childNodes, targetPath);
                return { ...node, children: loadedChildren, expanded: true };
              } else {
                // 자식이 이미 있으면 재귀적으로 처리
                const loadedChildren = await loadPathRecursively(node.children, targetPath);
                return { ...node, children: loadedChildren, expanded: true };
              }
            }
          }
          
          // 자식이 있으면 재귀적으로 처리
          if (node.children && node.children.length > 0) {
            return { ...node, children: await loadPathRecursively(node.children, targetPath) };
          }
          
          return node;
        }));
      };

      // 현재 트리 상태를 가져와서 업데이트
      setTree(prevTree => {
        if (prevTree.length === 0) return prevTree;
        
        loadPathRecursively(prevTree, currentPath).then(updatedTree => {
          setTree(updatedTree);
        });
        return prevTree;
      });
    };

    expandAndLoadPath();
  }, [currentPath, fs]);


  const loadChildren = async (node: TreeNode): Promise<TreeNode[]> => {
    try {
      const childrenResult = fs.ls(node.fullPath);
      const children = childrenResult instanceof Promise 
        ? await childrenResult 
        : childrenResult;
      return children.map(child => ({
        ...child,
        fullPath: node.fullPath === '/' 
          ? `/${child.name}` 
          : `${node.fullPath}/${child.name}`,
        expanded: expandedPaths.has(
          node.fullPath === '/' 
            ? `/${child.name}` 
            : `${node.fullPath}/${child.name}`
        ),
        children: child.type === 'directory' ? [] : undefined,
      }));
    } catch (error) {
      return [];
    }
  };

  const toggleExpand = useCallback(async (node: TreeNode) => {
    if (node.type !== 'directory') return;

    const newExpanded = !expandedPaths.has(node.fullPath);
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newExpanded) {
        newSet.add(node.fullPath);
      } else {
        newSet.delete(node.fullPath);
      }
      return newSet;
    });

    // 트리 업데이트
    const updateTree = async (nodes: TreeNode[]): Promise<TreeNode[]> => {
      return Promise.all(nodes.map(async (n) => {
        if (n.fullPath === node.fullPath) {
          const children = await loadChildren(n);
          return { ...n, expanded: newExpanded, children };
        }
        if (n.children) {
          return { ...n, children: await updateTree(n.children) };
        }
        return n;
      }));
    };

    const updatedTree = await updateTree(tree);
    setTree(updatedTree);
  }, [tree, expandedPaths, fs]);

  const handleNodeClick = useCallback(async (node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (node.type === 'directory') {
      if (e.detail === 2) {
        // 더블 클릭 시 이동
        onPathChange(node.fullPath);
      } else {
        // 싱글 클릭 시 확장/축소
        await toggleExpand(node);
      }
    } else {
      // 파일 클릭 시 열기
      onFileOpen(node.fullPath);
    }
  }, [onPathChange, onFileOpen, toggleExpand]);

  const renderNode = useCallback((node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedPaths.has(node.fullPath);
    const isCurrent = node.fullPath === currentPath;
    const hasChildren = node.type === 'directory' && node.children && node.children.length > 0;

    return (
      <div key={node.fullPath} className="file-explorer-node">
        <div
          className={`file-explorer-item ${isCurrent ? 'current' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={(e) => handleNodeClick(node, e)}
        >
          <span className="file-explorer-icon">
            {node.type === 'directory' ? (
              isExpanded ? '📂' : '📁'
            ) : (
              '📄'
            )}
          </span>
          <span className="file-explorer-name">{node.name}</span>
        </div>
        {node.type === 'directory' && isExpanded && node.children && (
          <div className="file-explorer-children">
            {node.children.map(child => renderNode(child as TreeNode, level + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedPaths, currentPath, handleNodeClick]);

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>파일 탐색기</h3>
      </div>
      <div className="file-explorer-content">
        <div className="file-explorer-tree">
          {tree.map(node => renderNode(node))}
        </div>
      </div>
    </div>
  );
};

