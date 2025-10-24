"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import instance, { MyQueryClient, QueryOptions } from "./index";

export const QueryContext = createContext<MyQueryClient>({} as MyQueryClient);

export const QueryContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <QueryContext.Provider value={useMemo(() => instance, [])}>
      {children}
    </QueryContext.Provider>
  );
};

export const useMyQueryContext = () => useContext(QueryContext);

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
