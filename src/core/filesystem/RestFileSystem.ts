// RESTful API 기반 파일시스템 구현

import { IFileSystem, FileNode } from './IFileSystem';
import { ApiClient, ApiClientConfig } from './api/ApiClient';
import { ApiFileNode } from './api/types';

export class RestFileSystem implements IFileSystem {
  private apiClient: ApiClient;
  private currentPath: string = '/';

  constructor(config: ApiClientConfig) {
    this.apiClient = new ApiClient(config);
  }

  async getCurrentPath(): Promise<string> {
    try {
      this.currentPath = await this.apiClient.getCurrentPath();
    } catch (error) {
      // 에러 발생 시 현재 경로 유지
    }
    return this.currentPath;
  }

  async cd(path: string): Promise<void> {
    await this.apiClient.changeDirectory(path);
    this.currentPath = await this.apiClient.getCurrentPath();
  }

  async ls(path?: string): Promise<FileNode[]> {
    const response = await this.apiClient.listDirectory(path);
    this.currentPath = response.path;
    
    return response.items.map(this.convertApiNodeToFileNode);
  }

  async mkdir(path: string): Promise<void> {
    await this.apiClient.createDirectory(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.apiClient.writeFile(path, content);
  }

  async readFile(path: string): Promise<string> {
    const response = await this.apiClient.readFile(path);
    return response.content;
  }

  async rm(path: string, recursive: boolean = false): Promise<void> {
    await this.apiClient.delete(path, recursive);
  }

  async cat(path: string): Promise<string> {
    return await this.readFile(path);
  }

  private convertApiNodeToFileNode(apiNode: ApiFileNode): FileNode {
    return {
      name: apiNode.name,
      type: apiNode.type,
      content: apiNode.content,
      children: apiNode.type === 'directory' ? [] : undefined,
    };
  }

  getApiClient(): ApiClient {
    return this.apiClient;
  }
}

