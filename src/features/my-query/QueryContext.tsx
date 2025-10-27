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

  const dispatchFetchingStartEvent = useCallback(() => {
    const fetchingEvent = new CustomEvent("myquery-fetching-start", {
      detail: {
        queryKey: queryOptionRef.current.queryKey,
      },
      bubbles: true,
      cancelable: false,
    });
    window.dispatchEvent(fetchingEvent);
  }, []);

  const dispatchFetchingEndEvent = useCallback(() => {
    const fetchingEvent = new CustomEvent("myquery-fetching-end", {
      detail: {
        queryKey: queryOptionRef.current.queryKey,
      },
      bubbles: true,
      cancelable: false,
    });
    window.dispatchEvent(fetchingEvent);
  }, []);

  const handleFetch = useCallback(async () => {
    try {
      isFetchingRef.current = true;
      dispatchFetchingStartEvent();
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
      dispatchFetchingEndEvent();
    }
  }, [updateQuery, dispatchFetchingStartEvent, dispatchFetchingEndEvent]);

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
    const queryOption = queryOptionRef.current;

    handleQuery();

    if (queryOption.refetchOnWindowFocus) {
      window.addEventListener("focus", handleQuery);
    }

    if (queryOption.retry) {
      retryTimer = setInterval(handleQuery, queryOption.retry);
    }

    return () => {
      if (queryOption.refetchOnWindowFocus) {
        window.removeEventListener("focus", handleQuery);
      }

      if (queryOption.retry && retryTimer) {
        clearInterval(retryTimer);
      }

      if (isExpiredGcTime(queryOption.queryKey)) {
        removeQuery(queryOption.queryKey);
      }
    };
  }, [isExpiredGcTime, removeQuery, handleQuery]);

  return { isLoading, data, refetch: handleFetch };
};
