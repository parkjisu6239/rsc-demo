# React Query 직접 구현해보기: 내 생각대로 설계하고 만들어본 쿼리 라이브러리

## 목차

1. [서론: 왜 React Query를 직접 구현해보기로 했나?](#서론-왜-react-query를-직접-구현해보기로-했나)
2. [초기 설계: 내 생각대로 쿼리 라이브러리 설계하기](#초기-설계-내-생각대로-쿼리-라이브러리-설계하기)
3. [핵심 기능 구현](#핵심-기능-구현)
4. [테스트 페이지 구성](#테스트-페이지-구성)
5. [트러블 슈팅](#트러블-슈팅)
6. [결과 및 성과](#결과-및-성과)
7. [Next Steps: 더 발전시킬 수 있는 기능들](#next-steps-더-발전시킬-수-있는-기능들)
8. [결론](#결론)

---

## 서론: 왜 React Query를 직접 구현해보기로 했나?

React Query(TanStack Query)는 현대 React 애플리케이션에서 서버 상태 관리를 위한 필수 라이브러리입니다. 하지만 단순히 라이브러리를 사용하는 것보다는, **내부 동작 원리를 이해하고 직접 구현해보는 것**이 더 깊은 학습으로 이어진다고 생각했습니다.

이번 프로젝트에서는 **React Query의 공식 구현체를 보지 않고**, 오직 사용해본 경험과 직관을 바탕으로 내 생각대로 설계하고 구현해보았습니다.

---

## 초기 설계: 내 생각대로 쿼리 라이브러리 설계하기

### 핵심 설계 아이디어

```typescript
// 쿼리 키를 id로 하는 객체가 있어야 한다.
// 이전 쿼리 결과를 캐싱해야 한다. -> 캐싱을 위한 데이터는 어디에?
// staleTime 이후에 새로 요청을 해야 한다. -> 조회하는 타이밍에만 체크한다.
// gcTime 이후면 캐싱 결과를 지워야 한다. -> 타이머를 동작시킨다? -> 부담됨 -> 캐싱된 데이터가 없는 것으로 간주한다?

// 캐싱된 값이 있을 때
// gcTime 이전, staleTime 이전 -> 캐싱된 값을 반환한다.
// gcTime 이전, staleTime 이후 -> 새로운 값을 캐싱하고, 캐싱된 값을 반환한다.
// gcTime 이후 -> 캐싱된 값을 제거하고, 새로 요청을 한다.
// 캐싱된 값이 없으면 새로 요청하고, 그 값을 캐싱한다.
```

### 설계 원칙

1. **캐싱 우선**: 동일한 쿼리 키에 대해서는 캐싱된 데이터 우선 사용
2. **조건부 페칭**: staleTime과 gcTime을 기반으로 한 스마트한 데이터 페칭
3. **메모리 효율성**: 불필요한 타이머 대신 조회 시점에 만료 여부 체크
4. **타입 안전성**: TypeScript를 활용한 타입 안전한 API 설계

---

## 핵심 기능 구현

### 1. 타입 정의

```typescript
export type QueryOptions = {
  queryKey: string;
  queryFn: () => Promise<any>;
  staleTime?: number;
  gcTime?: number;
};

export type QueryCache = {
  queryKey: string;
  modifiedAt: number;
  data: any;
};
```

### 2. MyQueryClient 클래스

```typescript
class MyQueryClient {
  private querys: Record<string, Required<QueryOptions>> = {};
  private queryCache: Record<string, QueryCache> = {};

  constructor() {
    this.querys = {};
    this.queryCache = {};
  }

  addQuery = (query: QueryOptions) => {
    this.querys[query.queryKey] = {
      ...query,
      staleTime: query.staleTime || 1000 * 60,
      gcTime: query.gcTime || 1000 * 60,
    };
  };

  updateQuery = (queryKey: string, data: any) => {
    const modifiedAt = typeof window !== "undefined" ? Date.now() : 0;
    this.queryCache[queryKey] = { queryKey, modifiedAt, data };
  };

  getQueryCache = (queryKey: string) => {
    return this.queryCache[queryKey];
  };

  isStale = (queryKey: string) => {
    if (typeof window === "undefined") return false;

    const query = this.querys[queryKey];
    const queryCache = this.queryCache[queryKey];
    if (!query || !queryCache) return false;
    return Date.now() - queryCache.modifiedAt > query.staleTime;
  };

  isExpiredGcTime = (queryKey: string) => {
    if (typeof window === "undefined") return false;

    const query = this.querys[queryKey];
    const queryCache = this.queryCache[queryKey];
    if (!query || !queryCache) return false;
    return Date.now() - queryCache.modifiedAt > query.gcTime;
  };
}
```

### 3. React Hook 구현

```typescript
export const useMyQuery = (queryOption: QueryOptions) => {
  const { addQuery, getQueryCache, updateQuery, isStale, isExpiredGcTime } =
    useMyQueryContext();

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    console.log("queryOption", queryOption.queryKey);
    const queryCache = getQueryCache(queryOption.queryKey);

    setIsLoading(true);

    if (!queryCache) {
      console.log("쿼리가 없음");
      addQuery(queryOption);
      queryOption.queryFn().then((data) => {
        updateQuery(queryOption.queryKey, data);
        setIsLoading(false);
        setData(data);
      });
      return;
    }

    if (
      isStale(queryOption.queryKey) ||
      isExpiredGcTime(queryOption.queryKey)
    ) {
      console.log("쿼리가 만료됨");
      queryOption.queryFn().then((data) => {
        updateQuery(queryOption.queryKey, data);
        setIsLoading(false);
        setData(data);
      });
      return;
    }

    console.log("쿼리가 유효함");
    setIsLoading(false);
    setData(queryCache.data);
  }, []);

  return { isLoading, data };
};
```

---

## 테스트 페이지 구성

### 탭 기반 조건부 렌더링

```typescript
// app/query-test/page.tsx
export default function QueryTestPage() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Query 테스트</h1>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded ${
            activeTab === "users" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 rounded ${
            activeTab === "posts" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Posts
        </button>
      </div>

      {activeTab === "users" && <UserContent />}
      {activeTab === "posts" && <PostContent />}
    </div>
  );
}
```

### 캐싱 동작 확인

1. **첫 번째 탭 클릭**: 네트워크 요청 발생
2. **다른 탭 클릭**: 새로운 네트워크 요청 발생
3. **이전 탭 재클릭**: 캐싱된 데이터 사용 (네트워크 요청 없음)

---

## 트러블 슈팅

### 1. 클래스 메서드에서 `this` undefined 에러

**문제**: React 컴포넌트에서 클래스 메서드를 사용할 때 `this` 컨텍스트가 사라짐

**해결**: Arrow function 사용으로 자동 바인딩

```typescript
// Before: 일반 메서드 (this 바인딩 필요)
addQuery(query: QueryOptions) { ... }

// After: Arrow function (자동 바인딩)
addQuery = (query: QueryOptions) => { ... }
```

### 2. useMyQuery가 두 번씩 실행되는 문제

**문제**: React Strict Mode와 useEffect 의존성 배열 문제

**해결**:

- React Strict Mode 비활성화 (`next.config.ts`)
- queryOption 객체를 컴포넌트 외부로 이동
- useEffect 의존성 배열 최적화

```typescript
// queryOption을 컴포넌트 외부로 이동
const userQueryOption = {
  queryKey: "users",
  queryFn: () => getUsers(),
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
};
```

### 3. Hydration 에러 (서버-클라이언트 불일치)

**문제**: `Date.now()` 사용으로 서버와 클라이언트의 시간이 달라서 hydration 에러 발생

**해결**: 클라이언트 사이드에서만 시간 체크

```typescript
updateQuery = (queryKey: string, data: any) => {
  const modifiedAt = typeof window !== "undefined" ? Date.now() : 0;
  this.queryCache[queryKey] = { queryKey, modifiedAt, data };
};

isStale = (queryKey: string) => {
  if (typeof window === "undefined") return false;
  // ... 클라이언트에서만 시간 체크
};
```

---

## 결과 및 성과

### 구현된 기능들

✅ **기본 캐싱**: 동일한 쿼리 키에 대한 데이터 캐싱  
✅ **조건부 페칭**: staleTime과 gcTime 기반 스마트 페칭  
✅ **타입 안전성**: TypeScript를 활용한 타입 안전한 API  
✅ **SSR 호환성**: 서버-클라이언트 hydration 문제 해결  
✅ **메모리 효율성**: 타이머 없이 조회 시점에 만료 체크

### 학습한 내용들

1. **React Query의 핵심 개념**: 캐싱, staleTime, gcTime의 동작 원리
2. **클래스 메서드 바인딩**: JavaScript의 `this` 컨텍스트 이해
3. **React Strict Mode**: 개발 환경에서의 이중 실행 문제
4. **SSR Hydration**: 서버와 클라이언트의 일관성 유지
5. **메모리 최적화**: 불필요한 객체 재생성 방지

---

## Next Steps: 더 발전시킬 수 있는 기능들

### 1. 고급 캐싱 전략

```typescript
// 쿼리 무효화 (invalidation)
invalidateQueries = (queryKey: string) => {
  // 특정 쿼리만 무효화
};

// 쿼리 프리페칭 (prefetching)
prefetchQuery = (queryKey: string, queryFn: () => Promise<any>) => {
  // 백그라운드에서 미리 데이터 로딩
};
```

### 2. 에러 처리 및 재시도

```typescript
type QueryOptions = {
  // ... 기존 옵션들
  retry?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
};
```

### 3. 옵티미스틱 업데이트

```typescript
// 낙관적 업데이트를 위한 mutation 지원
useMyMutation = (mutationFn: (variables: any) => Promise<any>) => {
  // 서버 응답 전에 UI 업데이트
};
```

### 4. 백그라운드 리프레시

```typescript
// 윈도우 포커스 시 자동 리프레시
// 네트워크 재연결 시 자동 리프레시
// 주기적 백그라운드 업데이트
```

### 5. 쿼리 의존성 관리

```typescript
// 쿼리 간 의존성 설정
// 부모 쿼리 실패 시 자식 쿼리도 실패
// 조건부 쿼리 실행
```

### 6. 개발자 도구

```typescript
// React DevTools 연동
// 쿼리 상태 시각화
// 캐시 내용 디버깅 도구
```

### 7. 성능 최적화

```typescript
// 가상화된 쿼리 리스트
// 메모리 사용량 모니터링
// 자동 가비지 컬렉션
```

---

## 결론

React Query를 직접 구현해보면서 얻은 가장 큰 깨달음은 **"단순해 보이는 기능도 내부적으로는 복잡한 로직이 필요하다"**는 것이었습니다.

### 주요 성과

1. **깊이 있는 이해**: 단순히 라이브러리를 사용하는 것을 넘어서 내부 동작 원리 파악
2. **문제 해결 능력**: 다양한 트러블 슈팅을 통해 디버깅 능력 향상
3. **설계 사고**: 사용자 관점에서 API를 설계하는 경험
4. **실무 적용**: 실제 프로젝트에서 바로 사용 가능한 수준의 구현

### 다음 단계

이제 기본적인 쿼리 라이브러리가 완성되었으니, 실제 React Query의 고급 기능들을 하나씩 구현해보면서 더욱 완성도 높은 라이브러리로 발전시켜 나가고 싶습니다.

특히 **에러 처리**, **옵티미스틱 업데이트**, **백그라운드 리프레시** 등의 기능들을 추가하여 실무에서도 사용할 수 있는 수준의 라이브러리로 만들어보는 것이 목표입니다.

---

_이 글은 React Query의 공식 구현체를 참고하지 않고, 순수하게 사용 경험과 직관을 바탕으로 구현한 개인 프로젝트입니다. 실제 React Query와는 구현 방식이나 성능에서 차이가 있을 수 있습니다._
