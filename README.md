# WebOS - 브라우저 기반 가상 운영체제

React 기반의 가상 운영체제 시스템입니다. 웹 터미널 CLI를 통해 파일시스템을 조작할 수 있습니다.

## 특징

- 🖥️ 브라우저에서 실행되는 가상 OS
- 💾 메모리 기반 파일시스템
- 🖱️ 웹 터미널 CLI 인터페이스
- 📁 기본 디렉토리 구조 제공

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

### 빌드

```bash
npm run build
```

## 사용 가능한 명령어

- `ls [경로]` - 디렉토리 내용 나열
- `cd [경로]` - 디렉토리 변경
- `pwd` - 현재 경로 출력
- `mkdir <경로>` - 디렉토리 생성
- `cat <파일>` - 파일 내용 출력
- `echo <텍스트>` - 텍스트 출력
- `touch <파일>` - 빈 파일 생성
- `rm [-r] <경로>` - 파일/디렉토리 삭제
- `clear` / `cls` - 화면 지우기
- `whoami` - 현재 사용자 출력
- `date` - 현재 날짜/시간 출력
- `history` - 명령어 히스토리 출력
- `help` - 도움말 출력

## 프로젝트 구조

```
src/
  ├── core/
  │   ├── FileSystem.ts    # 메모리 기반 파일시스템
  │   └── CLI.ts           # CLI 명령어 처리
  ├── components/
  │   ├── Terminal.tsx     # 터미널 UI 컴포넌트
  │   └── Terminal.css     # 터미널 스타일
  ├── App.tsx              # 메인 앱 컴포넌트
  ├── App.css              # 앱 스타일
  └── main.tsx             # 엔트리 포인트
```

## 기술 스택

- React 18
- TypeScript
- Vite
- CSS3

