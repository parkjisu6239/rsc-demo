"use client";

import { createContext, useContext, useState } from "react";
import instance, { MyQueryClient, QueryOptions, QueryCache } from "./index";

export const QueryContext = createContext<MyQueryClient>({} as MyQueryClient);

export const QueryContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <QueryContext.Provider value={instance}>{children}</QueryContext.Provider>
  );
};

export const useMyQueryContext = () => useContext(QueryContext);

export const useMyQuery = (queryOption: QueryOptions) => {
  const { addQuery, getQueryCache, updateQuery, isStale, isExpiredGcTime } =
    useMyQueryContext();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const queryCache = getQueryCache(queryOption.queryKey);

  if (!queryCache) {
    addQuery(queryOption);
    setIsLoading(true);
    queryOption.queryFn().then((data) => {
      updateQuery(queryOption.queryKey, data);
      setIsLoading(false);
      setData(data);
    });
  } else if (isStale(queryOption.queryKey)) {
    setIsLoading(true);
    queryOption.queryFn().then((data) => {
      updateQuery(queryOption.queryKey, data);
      setIsLoading(false);
      setData(data);
    });
  } else {
    setIsLoading(false);
    setData(queryCache.data);
  }

  return { isLoading, data };
};
