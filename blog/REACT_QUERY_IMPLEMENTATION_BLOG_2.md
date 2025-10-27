# React Query 직접 구현해보기 2편: 타입 안전성과 고급 기능 추가

## 목차

1. [서론: 1편 이후의 개선사항](#서론-1편-이후의-개선사항)
2. [타입 안전성 강화](#타입-안전성-강화)
3. [에러 처리 및 콜백 시스템](#에러-처리-및-콜백-시스템)
4. [고급 캐싱 기능](#고급-캐싱-기능)
5. [성능 최적화](#성능-최적화)
6. [트러블 슈팅 2편](#트러블-슈팅-2편)
7. [Next Steps: Mutation과 옵티미스틱 업데이트](#next-steps-mutation과-옵티미스틱-업데이트)
8. [결론](#결론)

---

## 서론: 1편 이후의 개선사항

1편에서 기본적인 쿼리 라이브러리를 구현한 후, 실제 사용하면서 발견한 문제점들과 개선사항들을 반영하여 더욱 견고하고 사용하기 편한 라이브러리로 발전시켰습니다.

이번 2편에서는 **타입 안전성 강화**, **에러 처리 시스템**, **고급 캐싱 기능** 등을 추가하여 실무에서도 사용할 수 있는 수준으로 개선한 과정을 다뤄보겠습니다.

---

## 타입 안전성 강화

### 1. 제네릭 타입 시스템 도입

1편에서는 `any` 타입을 사용했지만, 2편에서는 제네릭을 활용한 타입 안전성을 확보했습니다.

```typescript
// Before (1편)
export type QueryOptions = {
  queryKey: string;
  queryFn: () => Promise<any>;
  // ...
};

// After (2편)
export type QueryData = string | number | boolean | object | null | undefined;

export type QueryOptions = {
  queryKey: string;
  queryFn: () => Promise<QueryData>;
  onSuccess?: (data: QueryData) => void;
  onError?: (error: Error) => void;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number;
};
```

### 2. 타입 가드와 유니온 타입

```typescript
export type QueryCache = {
  queryKey: string;
  modifiedAt: number;
  data: QueryData;
};
```

**개선점:**

- ✅ **타입 안전성**: `any` 대신 명확한 타입 정의
- ✅ **IDE 지원**: 자동완성과 타입 체크 강화
- ✅ **런타임 안전성**: 컴파일 타임에 오류 감지

---

## 에러 처리 및 콜백 시스템

### 1. 에러 처리 메커니즘

```typescript
export type QueryOptions = {
  // ... 기존 옵션들
  onSuccess?: (data: QueryData) => void;
  onError?: (error: Error) => void;
  retry?: number;
};
```

### 2. 재시도 로직 구현

```typescript
// QueryContext.tsx에서 구현
const executeQuery = async (queryOption: QueryOptions, retryCount = 0) => {
  try {
    const data = await queryOption.queryFn();
    updateQuery(queryOption.queryKey, data);
    queryOption.onSuccess?.(data);
    setIsLoading(false);
    setData(data);
  } catch (error) {
    if (retryCount < (queryOption.retry || 0)) {
      // 재시도
      setTimeout(() => {
        executeQuery(queryOption, retryCount + 1);
      }, 1000 * Math.pow(2, retryCount)); // 지수 백오프
    } else {
      // 최종 실패
      queryOption.onError?.(error as Error);
      setIsError(true);
      setError(error as Error);
    }
  }
};
```

### 3. 에러 상태 관리

```typescript
export const useMyQuery = (queryOption: QueryOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<QueryData>(null);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ... 쿼리 로직

  return { isLoading, data, isError, error };
};
```

**개선점:**

- ✅ **에러 핸들링**: 명시적인 에러 상태 관리
- ✅ **재시도 로직**: 지수 백오프를 활용한 스마트 재시도
- ✅ **콜백 시스템**: 성공/실패 시 사용자 정의 로직 실행

---

## 고급 캐싱 기능

### 1. 쿼리 무효화 (Invalidation)

```typescript
// index.ts
export const invalidateQueries = (queryKey: string) => {
  instance.removeQuery(queryKey);
};

// 사용 예시
const handleRefresh = () => {
  invalidateQueries("users");
  // 다음 렌더링에서 새로운 데이터 요청
};
```

### 2. 윈도우 포커스 리프레시

```typescript
export type QueryOptions = {
  // ... 기존 옵션들
  refetchOnWindowFocus?: boolean;
};

// QueryContext.tsx에서 구현
useEffect(() => {
  if (!queryOption.refetchOnWindowFocus) return;

  const handleFocus = () => {
    if (isStale(queryOption.queryKey)) {
      executeQuery(queryOption);
    }
  };

  window.addEventListener("focus", handleFocus);
  return () => window.removeEventListener("focus", handleFocus);
}, [queryOption.refetchOnWindowFocus]);
```

### 3. 개선된 캐시 관리

```typescript
class MyQueryClient {
  // ... 기존 코드

  // 쿼리 상태 확인
  getQueryStatus = (queryKey: string) => {
    const query = this.querys[queryKey];
    const cache = this.queryCache[queryKey];

    if (!query) return "idle";
    if (!cache) return "loading";
    if (isStale(queryKey)) return "stale";
    return "fresh";
  };

  // 모든 쿼리 상태 조회
  getAllQueries = () => {
    return Object.keys(this.querys).map((key) => ({
      queryKey: key,
      status: this.getQueryStatus(key),
      data: this.queryCache[key]?.data,
      modifiedAt: this.queryCache[key]?.modifiedAt,
    }));
  };
}
```

**개선점:**

- ✅ **수동 무효화**: 필요시 캐시 강제 갱신
- ✅ **자동 리프레시**: 윈도우 포커스 시 스마트 갱신
- ✅ **상태 추적**: 쿼리 상태를 명확히 파악 가능

---

## 성능 최적화

### 1. 메모이제이션 개선

```typescript
// QueryContext.tsx
export const useMyQuery = (queryOption: QueryOptions) => {
  // queryOption을 더 세밀하게 메모이제이션
  const memoizedQueryOption = useMemo(
    () => queryOption,
    [
      queryOption.queryKey,
      queryOption.staleTime,
      queryOption.gcTime,
      queryOption.retry,
      queryOption.refetchOnWindowFocus,
    ]
  );

  // ... 나머지 로직
};
```

### 2. 불필요한 리렌더링 방지

```typescript
// 쿼리 옵션을 컴포넌트 외부로 이동
const userQueryOption = {
  queryKey: "users",
  queryFn: () => getUsers(),
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  retry: 3,
  refetchOnWindowFocus: true,
} as const; // const assertion으로 타입 안전성 강화
```

### 3. 메모리 사용량 최적화

```typescript
// 가비지 컬렉션 최적화
clearExpiredQueries = () => {
  const now = Date.now();
  Object.keys(this.queryCache).forEach((key) => {
    const query = this.querys[key];
    const cache = this.queryCache[key];

    if (query && cache && now - cache.modifiedAt > query.gcTime) {
      this.removeQuery(key);
    }
  });
};
```

---

## 트러블 슈팅 2편

### 1. 타입 에러 해결

**문제**: 제네릭 타입 도입 시 복잡한 타입 에러 발생

**해결**: 단계적 타입 개선

```typescript
// 1단계: 기본 타입 정의
export type QueryData = string | number | boolean | object | null | undefined;

// 2단계: 제네릭 적용
export type QueryOptions<T = QueryData> = {
  queryKey: string;
  queryFn: () => Promise<T>;
  // ...
};

// 3단계: 타입 추론 개선
const queryOption = {
  queryKey: "users",
  queryFn: () => getUsers(), // 반환 타입 자동 추론
} as const;
```

### 2. 에러 상태 동기화 문제

**문제**: 에러 발생 시 상태가 일관되지 않음

**해결**: 상태 관리 로직 개선

```typescript
const executeQuery = async (queryOption: QueryOptions, retryCount = 0) => {
  setIsLoading(true);
  setIsError(false);
  setError(null);

  try {
    // ... 성공 로직
  } catch (error) {
    // ... 에러 처리 로직
  }
};
```

### 3. 메모리 누수 방지

**문제**: 이벤트 리스너와 타이머가 정리되지 않음

**해결**: cleanup 로직 추가

```typescript
useEffect(() => {
  // ... 이벤트 리스너 등록

  return () => {
    // cleanup 로직
    window.removeEventListener("focus", handleFocus);
    if (timeoutId) clearTimeout(timeoutId);
  };
}, []);
```

---

## Next Steps: Mutation과 옵티미스틱 업데이트

### 1. Mutation 시스템

```typescript
// 다음 시리즈에서 구현할 기능
export type MutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables
  ) => void;
};

export const useMyMutation = <TData, TVariables>(
  options: MutationOptions<TData, TVariables>
) => {
  // mutation 로직 구현
};
```

### 2. 옵티미스틱 업데이트

```typescript
// 낙관적 업데이트를 위한 기능
export type OptimisticUpdateOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  optimisticUpdate: (variables: TVariables) => TData;
  rollbackOnError?: boolean;
};
```

### 3. 쿼리 의존성 관리

```typescript
// 쿼리 간 의존성 설정
export type QueryDependency = {
  queryKey: string;
  condition: (data: any) => boolean;
};

export type QueryOptions = {
  // ... 기존 옵션들
  dependencies?: QueryDependency[];
};
```

### 4. 백그라운드 동기화

```typescript
// 백그라운드에서 자동으로 데이터 동기화
export type BackgroundSyncOptions = {
  interval?: number;
  onWindowFocus?: boolean;
  onNetworkReconnect?: boolean;
};
```

---

## 결론

2편에서는 1편의 기본 구현을 바탕으로 **실무에서 사용할 수 있는 수준**으로 라이브러리를 발전시켰습니다.

### 주요 개선사항

1. **타입 안전성**: `any` 제거하고 명확한 타입 시스템 구축
2. **에러 처리**: 재시도 로직과 콜백 시스템으로 견고한 에러 처리
3. **고급 캐싱**: 무효화, 자동 리프레시 등 스마트한 캐시 관리
4. **성능 최적화**: 메모리 사용량과 리렌더링 최적화

### 학습한 내용

- **제네릭 활용**: 복잡한 타입 시스템 설계 경험
- **에러 처리 패턴**: 재시도 로직과 상태 관리
- **메모리 관리**: 가비지 컬렉션과 이벤트 리스너 정리
- **사용자 경험**: 콜백 시스템과 자동화 기능

### 다음 단계

3편에서는 **Mutation 시스템**과 **옵티미스틱 업데이트**를 구현하여 완전한 상태 관리 라이브러리로 완성할 예정입니다. 이를 통해 서버 상태와 클라이언트 상태를 통합적으로 관리할 수 있는 강력한 도구를 만들어보겠습니다.

---

_이 글은 React Query의 공식 구현체를 참고하지 않고, 순수하게 사용 경험과 직관을 바탕으로 구현한 개인 프로젝트의 2편입니다. 실제 React Query와는 구현 방식이나 성능에서 차이가 있을 수 있습니다._
