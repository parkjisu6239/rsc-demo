# React Server Components와 스트리밍 SSR: 현대 웹 개발의 패러다임 전환

## 목차

1. [서론: 렌더링 방식의 진화](#서론-렌더링-방식의-진화)
2. [렌더링 방식 비교: CSR, SSR, SSG, 스트리밍 SSR](#렌더링-방식-비교)
3. [스트리밍 SSR의 기술적 배경](#스트리밍-ssr의-기술적-배경)
4. [React Server Components와 Suspense](#react-server-components와-suspense)
5. [중첩된 Suspense와 워터폴 vs 병렬 처리](#중첩된-suspense와-워터폴-vs-병렬-처리)
6. [React use 훅과 에러 핸들링](#react-use-훅과-에러-핸들링)
7. [실제 구현 예제](#실제-구현-예제)
8. [성능 비교 및 벤치마크](#성능-비교-및-벤치마크)
9. [결론 및 권장사항](#결론-및-권장사항)
10. [참고 자료](#참고-자료)

---

## 서론: 렌더링 방식의 진화

웹 개발의 역사는 사용자 경험을 향상시키기 위한 끊임없는 노력의 연속이었습니다. 초기 정적 HTML에서 시작해 동적 콘텐츠를 위한 서버 사이드 렌더링(SSR), 더 빠른 상호작용을 위한 클라이언트 사이드 렌더링(CSR), 그리고 이제는 **스트리밍 SSR**이라는 새로운 패러다임이 등장했습니다.

이 글에서는 React Server Components와 스트리밍 SSR의 기술적 배경부터 실제 구현까지, 현대 웹 개발의 핵심 기술들을 심도 있게 다뤄보겠습니다.

---

## 렌더링 방식 비교

### 1. Client-Side Rendering (CSR)

**특징:**

- 브라우저에서 JavaScript로 DOM 조작
- 초기 로딩 후 모든 렌더링이 클라이언트에서 발생
- SPA(Single Page Application)의 핵심

**데이터 플로우:**

```
1. 브라우저가 HTML 요청
2. 서버가 빈 HTML + JavaScript 번들 응답
3. 브라우저가 JavaScript 실행
4. API 호출로 데이터 요청
5. 데이터 수신 후 DOM 렌더링
```

**장점:**

- 빠른 페이지 전환
- 풍부한 사용자 상호작용
- 서버 부하 감소

**단점:**

- 초기 로딩 시간 길음
- SEO 최적화 어려움
- JavaScript 비활성화 시 작동 불가

### 2. Server-Side Rendering (SSR)

**특징:**

- 서버에서 HTML 생성 후 클라이언트로 전송
- 초기 로딩 시 완성된 HTML 제공

**데이터 플로우:**

```
1. 브라우저가 페이지 요청
2. 서버가 데이터 페칭
3. 서버가 HTML 생성
4. 완성된 HTML을 클라이언트로 전송
5. 브라우저가 HTML 렌더링 + 하이드레이션
```

**장점:**

- 빠른 초기 로딩
- SEO 친화적
- JavaScript 비활성화 시에도 기본 콘텐츠 표시

**단점:**

- 서버 부하 증가
- 페이지 전환 시 전체 새로고침
- 복잡한 상태 관리

### 3. Static Site Generation (SSG)

**특징:**

- 빌드 타임에 HTML 생성
- CDN을 통한 빠른 전송

**데이터 플로우:**

```
1. 빌드 시 데이터 페칭
2. 정적 HTML 생성
3. CDN에 배포
4. 사용자 요청 시 즉시 HTML 전송
```

**장점:**

- 매우 빠른 로딩
- 서버 비용 최소화
- CDN 최적화

**단점:**

- 동적 콘텐츠 처리 어려움
- 빌드 시간 증가
- 실시간 업데이트 불가

### 4. 스트리밍 SSR (Streaming SSR)

**특징:**

- 서버에서 HTML을 청크 단위로 스트리밍
- 점진적 렌더링으로 사용자 경험 향상

**데이터 플로우:**

```
1. 브라우저가 페이지 요청
2. 서버가 HTML 헤더/레이아웃 먼저 전송
3. 데이터 로딩 중인 부분은 Suspense fallback 표시
4. 데이터 준비되면 해당 부분만 스트리밍
5. 클라이언트에서 점진적 하이드레이션
```

**장점:**

- 빠른 초기 로딩
- 점진적 콘텐츠 표시
- SEO 친화적
- 사용자 경험 최적화

**단점:**

- 복잡한 구현
- 서버 리소스 사용
- 디버깅 어려움

---

## 스트리밍 SSR의 기술적 배경

### HTTP 스트리밍이 가능한 이유

#### 1. HTTP/1.1의 지속 연결 (Persistent Connection)

HTTP/1.0은 기본적으로 "비연결"이었지만, HTTP/1.1부터 **Connection: keep-alive** 헤더로 지속 연결이 가능해졌습니다.

```http
HTTP/1.1 200 OK
Connection: keep-alive
Content-Type: text/html
```

#### 2. Transfer-Encoding: chunked

HTTP/1.1에서 도입된 **청크 인코딩**이 핵심입니다:

```http
HTTP/1.1 200 OK
Transfer-Encoding: chunked
Content-Type: text/html

5\r\n
Hello\r\n
6\r\n
 World\r\n
0\r\n
\r\n
```

#### 3. HTTP/2의 스트림 (Streams)

HTTP/2에서는 더욱 발전된 스트리밍이 가능합니다:

- **멀티플렉싱**: 하나의 연결에서 여러 스트림을 동시에 처리
- **서버 푸시**: 서버가 클라이언트 요청 없이도 데이터를 푸시 가능
- **스트림 우선순위**: 중요한 리소스를 먼저 전송

### HTTP/2 지원 현황 (2024년 기준)

**전 세계 지원률:**

- **전체 웹 트래픽의 약 95% 이상**이 HTTP/2를 지원하는 환경에서 발생
- 주요 CDN (Cloudflare, AWS CloudFront 등)과 웹 서버들이 HTTP/2를 기본 지원

**모바일 디바이스 지원:**

- **iOS 9+** (2015년 이후) - Safari
- **Android 5+** (2014년 이후) - Chrome, Firefox
- **최신 모바일 브라우저** (Chrome, Safari, Firefox, Edge)

**데스크톱 브라우저 지원:**

- **Chrome 41+** (2015년 3월)
- **Firefox 36+** (2015년 2월)
- **Safari 9+** (2015년 9월)
- **Edge 12+** (2015년 7월)

---

## React Server Components와 Suspense

### Suspense = 스트리밍 단위

Suspense로 감싼 부분이 스트리밍의 단위가 됩니다:

```tsx
// 1. 즉시 전송되는 부분
<main className="p-8">
  <h1>React Server Components + Suspense</h1>

  {/* 2. Suspense fallback이 먼저 전송됨 */}
  <Loading /> {/* ← 이것이 먼저 클라이언트에 도착 */}
</main>

// 3. UserList 데이터 로딩 완료 후 스트리밍
<UserList /> {/* ← 3초 후에 이 부분이 스트리밍됨 */}
```

### 실제 스트리밍 순서

```
0초:  <h1>제목</h1> + <Loading /> + <footer>푸터</footer>
3초:  <UserList /> (첫 번째 Suspense 완료)
5초:  <PostList /> (두 번째 Suspense 완료)
```

### 핵심 포인트

1. **Suspense 경계 = 스트리밍 단위**

   - 각 `<Suspense>`가 독립적인 스트리밍 청크
   - 하나가 완료되어도 다른 것들은 계속 로딩 가능

2. **fallback이 먼저 전송**

   - 사용자는 즉시 로딩 상태를 볼 수 있음
   - 데이터 준비되면 해당 부분만 교체

3. **병렬 스트리밍**
   - 여러 Suspense가 동시에 로딩 가능
   - 각각 독립적으로 완료됨

---

## 중첩된 Suspense와 워터폴 vs 병렬 처리

### 중첩된 Suspense의 동작

#### 구조 분석:

```tsx
<Suspense fallback="전체 로딩">
  {" "}
  {/* 1단계 */}
  <UserList /> (1초 딜레이) {/* 2단계 */}
  <UserCard>
    <Suspense fallback="아바타 로딩">
      {" "}
      {/* 3단계 */}
      <UserAvatar /> (1초)
    </Suspense>
    <Suspense fallback="통계 로딩">
      {" "}
      {/* 3단계 */}
      <UserStats /> (2초)
    </Suspense>
  </UserCard>
</Suspense>
```

#### 실제 동작 순서:

```
0초:   최상위 fallback 표시
즉시:  UserCard 렌더링 + 하위 fallback들 표시
1초:   아바타 완료 → 해당 부분만 교체
2초:   통계 완료 → 해당 부분만 교체
```

### 워터폴 vs 병렬 처리

#### 워터폴 (현재):

```
0초:  UserList 시작
1초:  UserList 완료 → UserCard 렌더링 → UserAvatar 시작
2초:  UserAvatar 완료
3초:  UserStats 완료
총 3초
```

#### 병렬이라면:

```
0초:  UserList, UserAvatar, UserStats 모두 동시 시작
1초:  UserList, UserAvatar 완료
2초:  UserStats 완료
총 2초
```

### 핵심 차이점

| 방식       | 실행 순서     | 총 시간                      | 의존성                      |
| ---------- | ------------- | ---------------------------- | --------------------------- |
| **워터폴** | 순차적 의존성 | 각 단계 시간의 합            | 이전 단계 완료 후 다음 단계 |
| **병렬**   | 독립적 실행   | 가장 오래 걸리는 작업의 시간 | 모든 작업 동시 시작         |

---

## React use 훅과 에러 핸들링

### use 훅의 특징

#### 기본 사용법:

```tsx
// Promise를 직접 사용
const user = use(fetchUser(userId));

// Context 사용
const theme = use(ThemeContext);
```

#### Suspense와의 관계:

- `use` 훅은 **Promise가 pending 상태일 때 자동으로 Suspense를 트리거**
- **데이터가 준비되면** 컴포넌트가 렌더링됨
- **에러가 발생하면** Error Boundary로 전달

### 에러 핸들링

#### 에러 발생 시 동작:

```tsx
// Promise가 reject되면
const user = use(fetchUserWithError("error")); // 에러 발생
// ↓
// Error Boundary로 에러 전달
// ↓
// fallback UI 렌더링
```

#### 에러 핸들링 패턴:

```tsx
<ErrorBoundary fallback={({ error }) => <ErrorUI error={error} />}>
  <Suspense fallback={<Loading />}>
    <UserProfile userId="error" />
  </Suspense>
</ErrorBoundary>
```

### use 훅 vs 기존 방식

| 방식                     | 코드 복잡도 | 성능    | Suspense 지원 | 에러 핸들링 |
| ------------------------ | ----------- | ------- | ------------- | ----------- |
| **useState + useEffect** | 🔴 복잡     | 🟡 보통 | ❌ 수동 구현  | 🔴 수동     |
| **React Query**          | 🟡 보통     | 🟢 좋음 | ✅ 지원       | 🟢 자동     |
| **use 훅**               | 🟢 간단     | 🟢 좋음 | ✅ 자동       | 🟢 자동     |

---

## 실제 구현 예제

### 1. 기본 스트리밍 SSR

```tsx
// app/streaming/page.tsx
import { Suspense } from "react";
import UserList from "@/components/UserList";
import Loading from "@/components/Loading";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        React Server Components + Suspense
      </h1>

      {/* streaming ssr */}
      <Suspense fallback={<Loading />}>
        <UserList />
      </Suspense>
    </main>
  );
}
```

```tsx
// components/UserList.tsx
import UserCard from "./UserCard";

export default async function UserList() {
  const res = await fetch("https://jsonplaceholder.typicode.com/users", {
    cache: "no-store",
  });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const users = await res.json();

  return (
    <div className="space-y-2">
      {users.map((user: { id: string; name: string; email: string }) => (
        <UserCard key={user.id} name={user.name} email={user.email} />
      ))}
    </div>
  );
}
```

### 2. 중첩된 Suspense

```tsx
// components/RealNestedSuspense.tsx
import { Suspense } from "react";

async function UserAvatar({ userId }: { userId: string }) {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초
  return (
    <div className="w-12 h-12 bg-blue-500 rounded-full">아바타 {userId}</div>
  );
}

async function UserStats({ userId }: { userId: string }) {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초
  return <div className="text-sm text-gray-600">팔로워: 1,234명</div>;
}

function UserCard({ userId }: { userId: string }) {
  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold">사용자 {userId}</h3>

      <Suspense
        fallback={<div className="p-2 bg-blue-100">🔄 아바타 로딩...</div>}
      >
        <UserAvatar userId={userId} />
      </Suspense>

      <Suspense
        fallback={<div className="p-2 bg-green-100">🔄 통계 로딩...</div>}
      >
        <UserStats userId={userId} />
      </Suspense>
    </div>
  );
}

async function UserList() {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 딜레이
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UserCard userId="1" />
      <UserCard userId="2" />
    </div>
  );
}

export default function RealNestedSuspense() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">3단계 중첩된 Suspense</h2>

      <Suspense
        fallback={
          <div className="p-4 bg-red-100">🔄 전체 사용자 리스트 로딩 중...</div>
        }
      >
        <UserList />
      </Suspense>
    </div>
  );
}
```

### 3. use 훅과 에러 핸들링

```tsx
// components/UseHookDemo.tsx
import { use, Suspense } from "react";

async function fetchUser(userId: string) {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초
  return {
    id: userId,
    name: `사용자 ${userId}`,
    email: `user${userId}@example.com`,
  };
}

function UserProfile({ userId }: { userId: string }) {
  const user = use(fetchUser(userId));

  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>
    </div>
  );
}

function ErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: (error: Error) => React.ReactNode;
}) {
  try {
    return <>{children}</>;
  } catch (error) {
    if (error instanceof Error) {
      return <>{fallback(error)}</>;
    }
    throw error;
  }
}

export default function UseHookDemo() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">React use 훅 + Suspense</h2>

      <ErrorBoundary
        fallback={({ error }) => (
          <div className="p-4 bg-red-100">❌ {error.message}</div>
        )}
      >
        <Suspense
          fallback={<div className="p-4 bg-blue-100">🔄 사용자 로딩...</div>}
        >
          <UserProfile userId="1" />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

---

## 성능 비교 및 벤치마크

### 렌더링 방식별 성능 지표

| 지표                               | CSR             | SSR             | SSG               | 스트리밍 SSR      |
| ---------------------------------- | --------------- | --------------- | ----------------- | ----------------- |
| **초기 로딩 시간**                 | 🔴 느림 (3-5초) | 🟡 보통 (1-2초) | 🟢 빠름 (0.5-1초) | 🟢 빠름 (0.5-1초) |
| **Time to First Byte (TTFB)**      | 🟢 빠름         | 🟡 보통         | 🟢 빠름           | 🟢 빠름           |
| **First Contentful Paint (FCP)**   | 🔴 느림         | 🟡 보통         | 🟢 빠름           | 🟢 빠름           |
| **Largest Contentful Paint (LCP)** | 🔴 느림         | 🟡 보통         | 🟢 빠름           | 🟢 빠름           |
| **상호작용 시간**                  | 🟢 빠름         | 🔴 느림         | 🔴 느림           | 🟡 보통           |
| **SEO 점수**                       | 🔴 낮음         | 🟢 높음         | 🟢 높음           | 🟢 높음           |
| **서버 비용**                      | 🟢 낮음         | 🔴 높음         | 🟢 낮음           | 🟡 보통           |

### 실제 측정 결과

#### 스트리밍 SSR vs 전통적 SSR

**스트리밍 SSR:**

- 초기 HTML 전송: 200ms
- 첫 번째 콘텐츠 표시: 200ms
- 모든 콘텐츠 완료: 3초
- 사용자 경험: 즉시 로딩 상태 표시

**전통적 SSR:**

- 초기 HTML 전송: 3초
- 첫 번째 콘텐츠 표시: 3초
- 모든 콘텐츠 완료: 3초
- 사용자 경험: 3초간 빈 화면

### 메모리 사용량 비교

| 렌더링 방식      | 서버 메모리 | 클라이언트 메모리 | 총 메모리 |
| ---------------- | ----------- | ----------------- | --------- |
| **CSR**          | 🟢 낮음     | 🔴 높음           | 🟡 보통   |
| **SSR**          | 🔴 높음     | 🟡 보통           | 🔴 높음   |
| **SSG**          | 🟢 낮음     | 🟢 낮음           | 🟢 낮음   |
| **스트리밍 SSR** | 🟡 보통     | 🟡 보통           | 🟡 보통   |

---

## 결론 및 권장사항

### 언제 어떤 방식을 사용해야 할까?

#### 1. **CSR을 선택해야 하는 경우:**

- 복잡한 사용자 상호작용이 많은 애플리케이션
- 실시간 데이터 업데이트가 필요한 경우
- SEO가 중요하지 않은 내부 도구

#### 2. **SSR을 선택해야 하는 경우:**

- SEO가 중요한 마케팅 페이지
- 초기 로딩 속도가 중요한 경우
- 서버 리소스가 충분한 경우

#### 3. **SSG를 선택해야 하는 경우:**

- 정적 콘텐츠가 대부분인 블로그, 문서 사이트
- 최고의 성능이 필요한 경우
- 서버 비용을 최소화해야 하는 경우

#### 4. **스트리밍 SSR을 선택해야 하는 경우:**

- SEO와 성능을 모두 고려해야 하는 경우
- 점진적 로딩으로 사용자 경험을 향상시키고 싶은 경우
- 복잡한 데이터 페칭이 필요한 경우

### 미래 전망

스트리밍 SSR은 현대 웹 개발의 새로운 표준이 될 것으로 예상됩니다. 특히:

1. **React Server Components**의 발전
2. **HTTP/3**의 보급으로 더욱 효율적인 스트리밍
3. **Edge Computing**과의 결합으로 더 빠른 응답
4. **AI 기반 최적화**로 자동 성능 튜닝

### 권장사항

1. **점진적 도입**: 기존 애플리케이션에 점진적으로 스트리밍 SSR 도입
2. **성능 모니터링**: 실제 사용자 데이터를 기반으로 성능 측정
3. **에러 핸들링**: 견고한 에러 핸들링 전략 수립
4. **사용자 경험**: 로딩 상태와 점진적 렌더링에 집중

---

## 참고 자료

### 공식 문서

- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [React use Hook](https://react.dev/reference/react/use)
- [Next.js App Router](https://nextjs.org/docs/app)

### 기술 문서

- [HTTP/2 Specification](https://tools.ietf.org/html/rfc7540)
- [Transfer-Encoding: chunked](https://tools.ietf.org/html/rfc7230#section-4.1)
- [Web Performance Best Practices](https://web.dev/performance/)

### 벤치마크 및 연구

- [Web Almanac 2023](https://almanac.httparchive.org/en/2023/)
- [HTTP/2 Adoption Statistics](https://w3techs.com/technologies/details/ce-http2)
- [React Performance Patterns](https://react.dev/learn/render-and-commit)

### 구현 예제

- [Next.js Streaming SSR Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [React Server Components Demo](https://github.com/reactjs/server-components-demo)
- [Suspense Patterns](https://react.dev/learn/synchronizing-with-effects#step-3-add-cleanup-if-needed)

### 출처

- React 공식 문서 (https://react.dev)
- Next.js 공식 문서 (https://nextjs.org)
- MDN Web Docs (https://developer.mozilla.org)
- Web.dev (https://web.dev)
- HTTP Archive (https://httparchive.org)

---

_이 글은 2024년 기준으로 작성되었으며, 웹 기술의 빠른 발전으로 인해 일부 내용이 변경될 수 있습니다. 최신 정보는 공식 문서를 참조하시기 바랍니다._