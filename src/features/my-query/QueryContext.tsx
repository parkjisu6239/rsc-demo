"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import instance, { MyQueryClient, QueryOptions } from "./index";

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

export const useMyQuery = <T extends object>(_queryOption: QueryOptions<T>) => {
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

  const refetch = useCallback(async () => {
    isFetchingRef.current = true;
    setIsLoading(true);
    const data = await queryOptionRef.current.queryFn();
    updateQuery(queryOptionRef.current.queryKey, data);
    setData(data);
    setIsLoading(false);
    isFetchingRef.current = false;
  }, [updateQuery]);

  useEffect(() => {
    if (isFetchingRef.current) return;

    const queryCache = getQueryCache(queryOptionRef.current.queryKey);

    if (!queryCache) {
      console.log("쿼리가 없음");
      addQuery(queryOptionRef.current);
      refetch();
      return;
    }

    if (
      isStale(queryOptionRef.current.queryKey) ||
      isExpiredGcTime(queryOptionRef.current.queryKey)
    ) {
      console.log("쿼리가 만료됨");
      refetch();
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
  }, [addQuery, refetch, getQueryCache, isExpiredGcTime, isStale, removeQuery]);

  return { isLoading, data, refetch };
};
