import { useEffect, useState } from "react";

interface UseIsFetchingProps {
  queryKeys?: string[];
  predicate?: (queryKey: string) => boolean;
}

function useIsFetching({ queryKeys, predicate }: UseIsFetchingProps = {}) {
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const handleFetchingStart = (event: CustomEvent) => {
      if (queryKeys && !queryKeys.includes(event.detail.queryKey)) return;
      if (predicate && !predicate(event.detail.queryKey)) return;
      setIsFetching(true);
    };

    const handleFetchingEnd = (event: CustomEvent) => {
      if (queryKeys && !queryKeys.includes(event.detail.queryKey)) return;
      if (predicate && !predicate(event.detail.queryKey)) return;
      setIsFetching(false);
    };

    window.addEventListener(
      "myquery-fetching-start",
      handleFetchingStart as EventListener
    );
    window.addEventListener(
      "myquery-fetching-end",
      handleFetchingEnd as EventListener
    );

    return () => {
      window.removeEventListener(
        "myquery-fetching-start",
        handleFetchingStart as EventListener
      );
      window.removeEventListener(
        "myquery-fetching-end",
        handleFetchingEnd as EventListener
      );
    };
  }, [queryKeys, predicate]);

  return isFetching;
}

export default useIsFetching;
