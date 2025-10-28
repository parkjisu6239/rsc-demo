export type TData = string | number | boolean | object | null | undefined;

type QueryConfig = {
  queryKey: Array<unknown>;
  queryFn: () => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number;
};

type QueryState<TData> = {
  data: TData | null;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  updatedAt: number;
};

class Query {
  private queryKey: Array<unknown>;
  private queryHash: string;
  private options: QueryConfig;
  private state: QueryState<TData>;

  constructor(config: QueryConfig) {
    this.queryKey = config.queryKey;
    this.queryHash = this.queryKey.sort().join("|");
    this.options = {
      ...config,
      staleTime: config.staleTime ?? 1000 * 60,
      gcTime: config.gcTime ?? 1000 * 60,
    };
    this.state = {
      data: null,
      isFetching: false,
      isError: false,
      isSuccess: false,
      updatedAt: 0,
    };
  }
}
