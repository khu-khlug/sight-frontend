# sight-frontend

경희대학교 중앙 IT 동아리 쿠러그의 프론트엔드 어플리케이션 저장소입니다.

## Prerequisites

- Node.js (버전은 [.nvmrc](.nvmrc) 참고)

## Installation

```sh
$ git clone https://github.com/khu-khlug/sight-frontend.git
$ yarn
```

## Run

```sh
$ yarn run dev
```

개발 서버에는 `dev/mockApi/`의 목업 API가 함께 실행됩니다. 별도의 백엔드 프로세스는 필요하지 않습니다. `.env.development`의 API 주소는 `/__mock-api`이며, 현재 사용자·알림·그룹 이모지 요청을 처리합니다. 구현되지 않은 목업 경로는 JSON 404를 반환합니다. 그룹 상세 화면의 임시 데이터는 `src/pages/member/group/detail/mockData.ts`에 있습니다.

목업의 현재 사용자를 운영진으로 확인하려면 `MOCK_MANAGER=true` 환경변수를 설정한 뒤 개발 서버를 실행하세요. 개발용 목업 API는 프로덕션 빌드에 포함되지 않으며, PWA 서비스워커 설정은 그대로 유지됩니다.

## Build

```sh
$ yarn run build
```

## 디렉토리 구조

```
sight-frontend/
├── public/
│   └── ...
├── src/
│   ├── api/               # API 호출과 관련된 로직
│   ├── components/        # 공통 UI 컴포넌트
│   ├── features/          # 페이지별 주요 기능을 담당하는 모듈
|   ├── hooks/             # 리액트 훅이 정의된 파일
│   ├── layouts/           # 레이아웃 관련 컴포넌트
│   ├── pages/             # 라우팅되는 주요 페이지들
│   ├── util/              # 공통으로 사용되는 유틸리티 함수
│   ├── App.tsx            # 라우트가 정의된 파일
│   ├── main.tsx           # 리액트 엔트리포인트
│   └── ...
└── package.json
```

개발 중에 위 디렉토리 구조 외 다른 디렉토리가 존재하는 걸 발견하시면, PR을 통해 수정해주세요!
