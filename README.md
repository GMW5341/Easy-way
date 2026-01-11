# 학원 스케줄링 관리 시스템 (Academy Management System)

학원에서 사용할 수 있는 웹 기반 종합 관리 시스템입니다.

## 주요 기능

### 1. 스케줄 최적화 알고리즘
- 학생의 수업 시간 변경 요청 시 가능 여부를 자동으로 판단
- 수용 인원, 시간 충돌 등을 고려한 지능형 알고리즘
- 변경이 불가능할 경우 최적의 대안 자동 추천
- 학생의 기존 수업 패턴을 분석하여 최적의 시간대 제안

### 2. 자동 출입 기록 시스템
- 학생 입실/퇴실 시간 자동 기록
- 수업 출석 현황 실시간 확인
- 결제한 수업 일수 대비 참석률 자동 계산
- 남은 수업 횟수 자동 차감 및 관리

### 3. 결제 시스템
- 현금, 카드, 계좌이체 등 다양한 결제 수단 지원
- 학생별, 수업별 결제 내역 관리
- 월별/기간별 매출 통계 및 리포트
- 미수금, 환불 내역 추적

### 4. 학생 관리
- 학생 정보 등록 및 관리
- 학부모 연락처 관리
- 수강 중인 수업 및 출석률 확인

### 5. 수업 및 스케줄 관리
- 수업 등록 및 관리
- 요일/시간대별 스케줄 설정
- 강의실 배정 관리
- 수강생 현황 확인

## 기술 스택

### Backend
- Node.js + Express
- SQLite (Database)
- JWT (Authentication)
- bcrypt (Password hashing)

### Frontend
- React 18
- Vite (Build tool)
- React Router (Routing)
- Axios (HTTP client)

## 설치 및 실행

### 1. 의존성 설치

```bash
# 모든 패키지 한번에 설치
npm run install-all

# 또는 개별 설치
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. 데이터베이스 초기화 및 샘플 데이터 생성

```bash
cd backend
node seed.js
```

이 명령어는 다음을 생성합니다:
- 관리자 계정: `admin` / `admin123`
- 샘플 학생 5명
- 샘플 수업 4개
- 샘플 스케줄
- 샘플 등록 및 결제 내역

### 3. 서버 실행

```bash
# 개발 모드 (백엔드 + 프론트엔드 동시 실행)
npm run dev

# 또는 개별 실행
npm run dev:backend  # 백엔드만 실행 (포트 5000)
npm run dev:frontend # 프론트엔드만 실행 (포트 3000)
```

### 4. 접속

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:5000/api

## 기본 사용법

### 로그인
1. 브라우저에서 http://localhost:3000 접속
2. 아이디: `admin`, 비밀번호: `admin123`로 로그인

### 학생 등록
1. 좌측 메뉴에서 "학생 관리" 클릭
2. "학생 추가" 버튼 클릭
3. 학생 정보 입력 후 저장

### 수업 및 스케줄 등록
1. "수업 관리"에서 수업 추가
2. "스케줄 관리"에서 요일/시간대 설정

### 출석 체크
1. "출결 관리" 메뉴 이동
2. "입실 처리" 버튼으로 학생 입실 기록
3. 수업 종료 후 "퇴실 처리" 클릭

### 스케줄 변경 요청
1. "시간 변경 요청" 메뉴 이동
2. "변경 요청 등록" 클릭
3. 학생, 현재 수업, 희망 스케줄 선택
4. "변경 가능 여부 확인" 버튼으로 알고리즘 실행
5. 시스템이 자동으로 가능 여부 판단 및 대안 제시

## API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 사용자 등록

### 학생
- `GET /api/students` - 전체 학생 조회
- `GET /api/students/:id` - 학생 상세 조회
- `GET /api/students/:id/attendance-stats` - 학생 출석 통계
- `POST /api/students` - 학생 등록
- `PUT /api/students/:id` - 학생 정보 수정
- `DELETE /api/students/:id` - 학생 삭제

### 수업
- `GET /api/courses` - 전체 수업 조회
- `POST /api/courses` - 수업 등록
- `PUT /api/courses/:id` - 수업 수정
- `DELETE /api/courses/:id` - 수업 삭제

### 스케줄
- `GET /api/schedules` - 전체 스케줄 조회
- `GET /api/schedules/:id/students` - 스케줄별 수강생 조회
- `POST /api/schedules` - 스케줄 등록
- `PUT /api/schedules/:id` - 스케줄 수정
- `DELETE /api/schedules/:id` - 스케줄 삭제

### 출석
- `GET /api/attendance` - 출석 기록 조회
- `GET /api/attendance/today` - 오늘 출석 현황
- `POST /api/attendance/check-in` - 입실 처리
- `POST /api/attendance/check-out` - 퇴실 처리

### 결제
- `GET /api/payments` - 결제 내역 조회
- `GET /api/payments/stats/summary` - 결제 통계
- `POST /api/payments` - 결제 등록
- `PUT /api/payments/:id` - 결제 수정

### 스케줄 변경 요청
- `GET /api/schedule-changes` - 변경 요청 조회
- `POST /api/schedule-changes` - 변경 요청 등록 (자동 최적화)
- `POST /api/schedule-changes/check-availability` - 변경 가능 여부 확인
- `PUT /api/schedule-changes/:id` - 요청 승인/거부

## 스케줄링 알고리즘 상세

### 최적화 프로세스
1. **수용 인원 확인**: 요청한 스케줄의 현재 등록 인원 확인
2. **시간 충돌 감지**: 학생의 다른 수업과 시간 중복 여부 확인
3. **대안 제시**: 불가능할 경우 같은 과목의 다른 시간대 추천
4. **우선순위 점수 계산**:
   - 충돌 없음: +50점
   - 낮은 수용률: +20점
   - 같은 요일 수업 있음: +10점

### 알고리즘 예시
```javascript
// 변경 가능 여부 확인
const feasibility = await optimizeScheduleChange(
  studentId,
  currentScheduleId,
  requestedScheduleId
);

// 결과:
// - feasible: true/false
// - reason: 가능/불가능 사유
// - alternatives: 대안 스케줄 목록 (점수순 정렬)
```

## 데이터베이스 스키마

### 주요 테이블
- **users**: 관리자 및 강사 계정
- **students**: 학생 정보
- **courses**: 수업 정보
- **schedules**: 수업 스케줄 (요일/시간)
- **enrollments**: 학생 수업 등록
- **attendance**: 출입 기록
- **payments**: 결제 내역
- **schedule_change_requests**: 스케줄 변경 요청

## 프로젝트 구조

```
Easy-way/
├── backend/                 # 백엔드 서버
│   ├── middleware/         # 미들웨어 (인증 등)
│   ├── routes/            # API 라우트
│   ├── services/          # 비즈니스 로직 (스케줄링 알고리즘 등)
│   ├── database.js        # 데이터베이스 설정
│   ├── server.js          # Express 서버
│   └── seed.js            # 샘플 데이터 생성
├── frontend/               # 프론트엔드 React 앱
│   └── src/
│       ├── components/    # React 컴포넌트
│       ├── api.js        # API 클라이언트
│       ├── App.jsx       # 메인 앱
│       └── main.jsx      # 진입점
└── package.json           # 루트 패키지 설정
```

## 라이선스

MIT
