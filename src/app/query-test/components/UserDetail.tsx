import { getUser } from "@/api";
import { useMyQuery } from "@/features/my-query/QueryContext";

function UserDetail({ userId }: { userId: string }) {
  const { isLoading, data } = useMyQuery({
    queryKey: `user-${userId}`,
    queryFn: () => getUser(userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  if (isLoading) return <div>Loading UserDetail...</div>;

  return <div>UserDetail {data?.name}</div>;
}

export default UserDetail;
