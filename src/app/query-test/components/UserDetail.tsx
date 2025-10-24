import { getUser } from "@/api";
import { useMyQuery } from "@/features/my-query/QueryContext";

function UserDetail({ userId }: { userId: string }) {
  const { isLoading, data } = useMyQuery<{ name: string }>({
    queryKey: `user-${userId}`,
    queryFn: () => getUser(userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  return (
    <div>
      {isLoading && <div>Loading UserDetail...</div>}
      {!isLoading && <div>UserDetail {data?.name}</div>}
    </div>
  );
}

export default UserDetail;
