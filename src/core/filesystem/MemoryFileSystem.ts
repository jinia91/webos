// 메모리 기반 파일시스템 구현

import { IFileSystem, FileNode } from './IFileSystem';

export class MemoryFileSystem implements IFileSystem {
  private root: FileNode;
  private currentPath: string[];

  constructor() {
    this.root = {
      name: '/',
      type: 'directory',
      children: [],
    };
    this.currentPath = [];
    this.initializeDefaultStructure();
  }

  private initializeDefaultStructure() {
    // 기본 디렉토리 구조 생성
    this.mkdir('/home');
    this.mkdir('/home/user');
    this.mkdir('/home/user/documents');
    this.mkdir('/home/user/downloads');
    this.mkdir('/tmp');
    this.mkdir('/var');
    this.mkdir('/var/log');
    
    // 기본 파일 생성
    this.writeFile('/home/user/readme.txt', 'WebOS에 오신 것을 환영합니다!\n이것은 메모리 기반 파일시스템입니다.');
    this.writeFile('/home/user/.bashrc', 'echo "WebOS Shell이 로드되었습니다."');
  }

  private getCurrentDirectory(): FileNode {
    let current = this.root;
    for (const segment of this.currentPath) {
      const child = current.children?.find(c => c.name === segment);
      if (!child || child.type !== 'directory') {
        throw new Error(`디렉토리를 찾을 수 없습니다: ${segment}`);
      }
      current = child;
    }
    return current;
  }

  private resolvePath(path: string): { node: FileNode; segments: string[] } {
    const segments = path.split('/').filter(s => s !== '');
    
    if (path.startsWith('/')) {
      // 절대 경로
      let current = this.root;
      for (const segment of segments) {
        if (segment === '..') {
          if (current.parent) {
            current = current.parent;
          }
        } else if (segment !== '.') {
          const next = current.children?.find(c => c.name === segment);
          if (!next) {
            throw new Error(`경로를 찾을 수 없습니다: ${path}`);
          }
          current = next;
        }
      }
      return { node: current, segments };
    } else {
      // 상대 경로
      const currentDir = this.getCurrentDirectory();
      let current = currentDir;
      for (const segment of segments) {
        if (segment === '..') {
          if (current.parent) {
            current = current.parent;
          }
        } else if (segment !== '.') {
          const next = current.children?.find(c => c.name === segment);
          if (!next) {
            throw new Error(`경로를 찾을 수 없습니다: ${path}`);
          }
          current = next;
        }
      }
      return { node: current, segments };
    }
  }

  private resolveParentPath(path: string): { parent: FileNode; name: string } {
    const segments = path.split('/').filter(s => s !== '');
    const name = segments.pop() || '';
    
    if (path.startsWith('/')) {
      let current = this.root;
      for (const segment of segments) {
        if (segment === '..') {
          if (current.parent) {
            current = current.parent;
          }
        } else if (segment !== '.') {
          const next = current.children?.find(c => c.name === segment);
          if (!next) {
            throw new Error(`부모 경로를 찾을 수 없습니다: ${path}`);
          }
          current = next;
        }
      }
      return { parent: current, name };
    } else {
      const currentDir = this.getCurrentDirectory();
      let current = currentDir;
      for (const segment of segments) {
        if (segment === '..') {
          if (current.parent) {
            current = current.parent;
          }
        } else if (segment !== '.') {
          const next = current.children?.find(c => c.name === segment);
          if (!next) {
            throw new Error(`부모 경로를 찾을 수 없습니다: ${path}`);
          }
          current = next;
        }
      }
      return { parent: current, name };
    }
  }

  getCurrentPath(): string {
    if (this.currentPath.length === 0) {
      return '/';
    }
    return '/' + this.currentPath.join('/');
  }

  cd(path: string): void {
    if (path === '/' || path === '') {
      this.currentPath = [];
      return;
    }

    const { node } = this.resolvePath(path);
    if (node.type !== 'directory') {
      throw new Error(`${path}는 디렉토리가 아닙니다`);
    }

    // 현재 경로 재구성
    if (path.startsWith('/')) {
      this.currentPath = path.split('/').filter(s => s !== '');
    } else {
      const segments = path.split('/').filter(s => s !== '');
      for (const segment of segments) {
        if (segment === '..') {
          this.currentPath.pop();
        } else if (segment !== '.') {
          this.currentPath.push(segment);
        }
      }
    }
  }

  ls(path?: string): FileNode[] {
    const targetPath = path || this.getCurrentPath();
    const { node } = this.resolvePath(targetPath);
    
    if (node.type !== 'directory') {
      throw new Error(`${targetPath}는 디렉토리가 아닙니다`);
    }

    return node.children || [];
  }

  mkdir(path: string): void {
    const { parent, name } = this.resolveParentPath(path);
    
    if (parent.children?.some(c => c.name === name)) {
      throw new Error(`이미 존재합니다: ${path}`);
    }

    if (!parent.children) {
      parent.children = [];
    }

    const newDir: FileNode = {
      name,
      type: 'directory',
      children: [],
      parent,
    };
    parent.children.push(newDir);
  }

  writeFile(path: string, content: string): void {
    const { parent, name } = this.resolveParentPath(path);
    
    if (!parent.children) {
      parent.children = [];
    }

    const existing = parent.children.find(c => c.name === name);
    if (existing) {
      if (existing.type === 'directory') {
        throw new Error(`${path}는 디렉토리입니다`);
      }
      existing.content = content;
    } else {
      const newFile: FileNode = {
        name,
        type: 'file',
        content,
        parent,
      };
      parent.children.push(newFile);
    }
  }

  readFile(path: string): string {
    const { node } = this.resolvePath(path);
    
    if (node.type !== 'file') {
      throw new Error(`${path}는 파일이 아닙니다`);
    }

    return node.content || '';
  }

  rm(path: string, recursive: boolean = false): void {
    const { node } = this.resolvePath(path);
    
    if (node.type === 'directory' && !recursive) {
      throw new Error(`${path}는 디렉토리입니다. -r 옵션을 사용하세요`);
    }

    if (!node.parent || !node.parent.children) {
      throw new Error('루트 디렉토리는 삭제할 수 없습니다');
    }

    const index = node.parent.children.findIndex(c => c.name === node.name);
    if (index !== -1) {
      node.parent.children.splice(index, 1);
    }
  }

  cat(path: string): string {
    return this.readFile(path);
  }
}

