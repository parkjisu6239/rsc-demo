export type QueryOptions<T> = {
  queryKey: string;
  queryFn: () => Promise<T>;
  staleTime?: number;
  gcTime?: number;
};

export type QueryCache<T> = {
  queryKey: string;
  modifiedAt: number;
  data: T;
};

class MyQueryClient {
  private querys: Record<string, Required<QueryOptions<object>>> = {};
  private queryCache: Record<string, QueryCache<object>> = {};

  constructor() {
    this.querys = {};
    this.queryCache = {};
  }

  addQuery = <T extends object>(query: QueryOptions<T>) => {
    this.querys[query.queryKey] = {
      ...query,
      staleTime: query.staleTime || 1000 * 60,
      gcTime: query.gcTime || 1000 * 60,
    };
  };

  updateQuery = <T extends object>(queryKey: string, data: T) => {
    // 클라이언트 사이드에서만 시간 기록
    const modifiedAt = typeof window !== "undefined" ? Date.now() : 0;
    this.queryCache[queryKey] = { queryKey, modifiedAt, data };
  };

  getQueryCache = (queryKey: string) => {
    return this.queryCache[queryKey];
  };

  isStale = (queryKey: string) => {
    // 클라이언트 사이드에서만 stale 체크
    if (typeof window === "undefined") return false;

    const query = this.querys[queryKey];
    const queryCache = this.queryCache[queryKey];
    if (!query || !queryCache) return false;
    return Date.now() - queryCache.modifiedAt > query.staleTime;
  };

  isExpiredGcTime = (queryKey: string) => {
    // 클라이언트 사이드에서만 gcTime 체크
    if (typeof window === "undefined") return false;

    const query = this.querys[queryKey];
    const queryCache = this.queryCache[queryKey];
    if (!query || !queryCache) return false;
    return Date.now() - queryCache.modifiedAt > query.gcTime;
  };

  removeQuery = (queryKey: string) => {
    delete this.querys[queryKey];
    delete this.queryCache[queryKey];
  };

  clearQueries = () => {
    this.querys = {};
    this.queryCache = {};
  };
}

const instance = new MyQueryClient();

export { MyQueryClient };
export default instance;

// 쿼리 키를 id 로 하는 객체가 있어야 한다.
// 이전 쿼리 결과를 캐싱해야 한다. -> 캐싱을 위한 데이터는 어디에?
// staleTime 이후에 새로 요청을 해야 한다. -> 조회하는 타이밍에만 체크 한다.
// gcTime 이후면 캐싱 결과를 지워야 한다. -> 타이머를 동작시킨다? -> 부담됨 -> 캐싱된 데이터가 없는 것으로 간주한다?

// 캐싱된 값이 있을 때
// gcTime 이전, staleTime 이전 -> 캐싱된 값을 반환한다.
// gcTime 이전, staleTime 이후 -> 새로운 값을 캐싱하고, 캐싱된 값을 반환한다.
// gcTime 이후 -> 캐싱된 값을 제거하고, 새로요 요청을 한다.
// 캐싱된 값이 없으면 새로 요청하고, 그 값을 캐싱한다.

export const invalidateQueries = (queryKey: string) => {
  instance.removeQuery(queryKey);
};
