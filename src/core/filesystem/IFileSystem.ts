// 파일시스템 인터페이스 정의

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
  parent?: FileNode;
}

export interface IFileSystem {
  getCurrentPath(): Promise<string> | string;
  cd(path: string): Promise<void> | void;
  ls(path?: string): Promise<FileNode[]> | FileNode[];
  mkdir(path: string): Promise<void> | void;
  writeFile(path: string, content: string): Promise<void> | void;
  readFile(path: string): Promise<string> | string;
  rm(path: string, recursive?: boolean): Promise<void> | void;
  cat(path: string): Promise<string> | string;
}

