// RESTful API 통신을 위한 타입 정의

export interface ApiFileNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  path: string;
  createdAt?: string;
  updatedAt?: string;
  size?: number;
}

export interface ApiListResponse {
  path: string;
  items: ApiFileNode[];
}

export interface ApiFileContentResponse {
  path: string;
  content: string;
  size: number;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  status: number;
}

export interface ApiCreateDirectoryRequest {
  path: string;
}

export interface ApiWriteFileRequest {
  path: string;
  content: string;
}

export interface ApiDeleteRequest {
  path: string;
  recursive?: boolean;
}

export interface ApiChangeDirectoryRequest {
  path: string;
}

