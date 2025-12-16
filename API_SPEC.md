# WebOS RESTful API 스펙

스프링 서버에서 구현해야 할 RESTful API 엔드포인트 스펙입니다.

## 기본 정보

- Base URL: `http://localhost:8080/api/filesystem`
- Content-Type: `application/json`
- Session 관리: `X-Session-Id` 헤더를 통한 세션 관리 (선택사항)

## 엔드포인트

### 1. 현재 경로 조회

**GET** `/api/filesystem/pwd`

**Response:**
```json
{
  "path": "/home/user"
}
```

---

### 2. 디렉토리 변경

**POST** `/api/filesystem/cd`

**Request Body:**
```json
{
  "path": "/home/user/documents"
}
```

**Response:**
- 200 OK: 성공
- 400 Bad Request: 잘못된 경로
- 404 Not Found: 경로를 찾을 수 없음

---

### 3. 디렉토리 목록 조회

**GET** `/api/filesystem/ls?path=/home/user`

**Query Parameters:**
- `path` (optional): 조회할 경로 (없으면 현재 경로)

**Response:**
```json
{
  "path": "/home/user",
  "items": [
    {
      "name": "documents",
      "type": "directory",
      "path": "/home/user/documents",
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-01-01T00:00:00",
      "size": null
    },
    {
      "name": "readme.txt",
      "type": "file",
      "path": "/home/user/readme.txt",
      "content": null,
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-01-01T00:00:00",
      "size": 1024
    }
  ]
}
```

---

### 4. 디렉토리 생성

**POST** `/api/filesystem/mkdir`

**Request Body:**
```json
{
  "path": "/home/user/newdir"
}
```

**Response:**
- 200 OK: 성공
- 400 Bad Request: 이미 존재하는 경로
- 409 Conflict: 부모 디렉토리가 없음

---

### 5. 파일 읽기

**GET** `/api/filesystem/cat?path=/home/user/readme.txt`

**Query Parameters:**
- `path` (required): 읽을 파일 경로

**Response:**
```json
{
  "path": "/home/user/readme.txt",
  "content": "파일 내용...",
  "size": 1024
}
```

**Error Response:**
```json
{
  "error": "FileNotFound",
  "message": "파일을 찾을 수 없습니다: /home/user/readme.txt",
  "status": 404
}
```

---

### 6. 파일 쓰기

**POST** `/api/filesystem/write`

**Request Body:**
```json
{
  "path": "/home/user/newfile.txt",
  "content": "파일 내용"
}
```

**Response:**
- 200 OK: 성공
- 400 Bad Request: 잘못된 요청
- 409 Conflict: 부모 디렉토리가 없음

---

### 7. 파일/디렉토리 삭제

**DELETE** `/api/filesystem/rm`

**Request Body:**
```json
{
  "path": "/home/user/oldfile.txt",
  "recursive": false
}
```

**Request Body (디렉토리 삭제):**
```json
{
  "path": "/home/user/olddir",
  "recursive": true
}
```

**Response:**
- 200 OK: 성공
- 400 Bad Request: 디렉토리는 recursive=true 필요
- 404 Not Found: 경로를 찾을 수 없음

---

## 에러 응답 형식

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "error": "ErrorCode",
  "message": "에러 메시지",
  "status": 400
}
```

**에러 코드:**
- `FileNotFound`: 파일/디렉토리를 찾을 수 없음
- `DirectoryNotFound`: 디렉토리를 찾을 수 없음
- `PathExists`: 경로가 이미 존재함
- `InvalidPath`: 잘못된 경로
- `NotADirectory`: 디렉토리가 아님
- `NotAFile`: 파일이 아님
- `DirectoryNotEmpty`: 디렉토리가 비어있지 않음 (recursive=false일 때)

---

## 데이터베이스 스키마 (MySQL)

### files 테이블

```sql
CREATE TABLE files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type ENUM('file', 'directory') NOT NULL,
    path VARCHAR(1000) NOT NULL UNIQUE,
    parent_path VARCHAR(1000),
    content TEXT,
    size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_path (path),
    INDEX idx_parent_path (parent_path)
);
```

### sessions 테이블 (선택사항)

```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    current_path VARCHAR(1000) DEFAULT '/',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 스프링 구현 예시

### Controller 예시

```java
@RestController
@RequestMapping("/api/filesystem")
public class FileSystemController {
    
    @GetMapping("/pwd")
    public ResponseEntity<PathResponse> getCurrentPath(
        @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        // 세션별 현재 경로 조회
        String path = fileSystemService.getCurrentPath(sessionId);
        return ResponseEntity.ok(new PathResponse(path));
    }
    
    @PostMapping("/cd")
    public ResponseEntity<Void> changeDirectory(
        @RequestBody ChangeDirectoryRequest request,
        @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        fileSystemService.changeDirectory(request.getPath(), sessionId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/ls")
    public ResponseEntity<ListResponse> listDirectory(
        @RequestParam(required = false) String path,
        @RequestHeader(value = "X-Session-Id", required = false) String sessionId
    ) {
        ListResponse response = fileSystemService.listDirectory(path, sessionId);
        return ResponseEntity.ok(response);
    }
    
    // ... 기타 엔드포인트
}
```

---

## 세션 관리

각 탭은 독립적인 세션을 가질 수 있습니다. `X-Session-Id` 헤더를 통해 세션을 구분합니다.

- 세션 ID가 없으면 기본 세션 사용
- 세션별로 현재 경로(`current_path`)를 관리
- 세션은 탭이 생성될 때 자동으로 생성

