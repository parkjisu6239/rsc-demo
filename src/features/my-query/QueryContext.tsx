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
    const queryOption = queryOptionRef.current;
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      const data = await queryOption.queryFn();
      updateQuery(queryOption.queryKey, data);
      setData(data as T);
      queryOption.onSuccess?.(data);
    } catch (error) {
      queryOption.onError?.(error as Error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [updateQuery]);

  useEffect(() => {
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

    return () => {
      if (isExpiredGcTime(queryOptionRef.current.queryKey)) {
        removeQuery(queryOptionRef.current.queryKey);
      }
    };
  }, [
    addQuery,
    handleFetch,
    getQueryCache,
    isExpiredGcTime,
    isStale,
    removeQuery,
  ]);

  return { isLoading, data, refetch: handleFetch };
};
