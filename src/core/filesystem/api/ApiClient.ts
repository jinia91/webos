// RESTful API 클라이언트

import {
  ApiListResponse,
  ApiFileContentResponse,
  ApiErrorResponse,
  ApiCreateDirectoryRequest,
  ApiWriteFileRequest,
  ApiDeleteRequest,
  ApiChangeDirectoryRequest,
} from './types';

export interface ApiClientConfig {
  baseUrl: string;
  sessionId?: string;
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private sessionId?: string;
  private timeout: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // trailing slash 제거
    this.sessionId = config.sessionId;
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json().catch(() => ({
          error: 'Unknown Error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        }));
        throw new Error(error.message || error.error);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('요청 시간이 초과되었습니다');
        }
        throw error;
      }
      throw new Error('알 수 없는 오류가 발생했습니다');
    }
  }

  async getCurrentPath(): Promise<string> {
    const response = await this.request<{ path: string }>('/api/filesystem/pwd');
    return response.path;
  }

  async changeDirectory(path: string): Promise<void> {
    const request: ApiChangeDirectoryRequest = { path };
    await this.request<void>('/api/filesystem/cd', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async listDirectory(path?: string): Promise<ApiListResponse> {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    return await this.request<ApiListResponse>(`/api/filesystem/ls${query}`);
  }

  async createDirectory(path: string): Promise<void> {
    const request: ApiCreateDirectoryRequest = { path };
    await this.request<void>('/api/filesystem/mkdir', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async readFile(path: string): Promise<ApiFileContentResponse> {
    const query = `?path=${encodeURIComponent(path)}`;
    return await this.request<ApiFileContentResponse>(`/api/filesystem/cat${query}`);
  }

  async writeFile(path: string, content: string): Promise<void> {
    const request: ApiWriteFileRequest = { path, content };
    await this.request<void>('/api/filesystem/write', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async delete(path: string, recursive: boolean = false): Promise<void> {
    const request: ApiDeleteRequest = { path, recursive };
    await this.request<void>('/api/filesystem/rm', {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }
}

