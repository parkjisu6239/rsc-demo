"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import instance, { MyQueryClient, QueryData, QueryOptions } from "./index";

export const QueryContext = createContext<MyQueryClient>({} as MyQueryClient);

export const QueryContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const myQueryClientRef = useRef(instance);
  return (
    <QueryContext.Provider value={myQueryClientRef.current}>
      {children}
    </QueryContext.Provider>
  );
};

export const useMyQuery = <T extends QueryData>(_queryOption: QueryOptions) => {
  const {
    addQuery,
    getQueryCache,
    updateQuery,
    isStale,
    isExpiredGcTime,
    removeQuery,
  } = useContext(QueryContext);

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const isFetchingRef = useRef(false);
  const queryOptionRef = useRef(_queryOption);

  const handleFetch = useCallback(async () => {
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      const data = await queryOptionRef.current.queryFn();
      updateQuery(queryOptionRef.current.queryKey, data);
      setData(data as T);
      queryOptionRef.current.onSuccess?.(data);
    } catch (error) {
      queryOptionRef.current.onError?.(error as Error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [updateQuery]);

  const handleQuery = useCallback(async () => {
    if (isFetchingRef.current) return;

    const queryCache = getQueryCache(queryOptionRef.current.queryKey);

    if (!queryCache) {
      console.log("쿼리가 없음");
      addQuery(queryOptionRef.current);
      handleFetch();
      return;
    }

    if (
      isStale(queryOptionRef.current.queryKey) ||
      isExpiredGcTime(queryOptionRef.current.queryKey)
    ) {
      console.log("쿼리가 만료됨");
      handleFetch();
      return;
    }

    console.log("쿼리가 유효함");
    setIsLoading(false);
    setData(queryCache.data as T);
  }, [getQueryCache, isStale, isExpiredGcTime, addQuery, handleFetch]);

  useEffect(() => {
    let retryTimer: NodeJS.Timeout | null = null;

    handleQuery();

    if (queryOptionRef.current.refetchOnWindowFocus) {
      window.addEventListener("focus", handleQuery);
    }

    if (queryOptionRef.current.retry) {
      retryTimer = setInterval(handleQuery, queryOptionRef.current.retry);
    }

    return () => {
      if (queryOptionRef.current.refetchOnWindowFocus) {
        window.removeEventListener("focus", handleQuery);
      }

      if (queryOptionRef.current.retry && retryTimer) {
        clearInterval(retryTimer);
      }

      if (isExpiredGcTime(queryOptionRef.current.queryKey)) {
        removeQuery(queryOptionRef.current.queryKey);
      }
    };
  }, [isExpiredGcTime, removeQuery, handleQuery, queryOptionRef]);

  return { isLoading, data, refetch: handleFetch };
};
