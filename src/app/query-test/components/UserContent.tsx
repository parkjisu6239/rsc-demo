"use client";

import { getUsers } from "@/api";
import { useMyQuery } from "@/features/my-query/QueryContext";

// queryOption을 컴포넌트 외부로 이동하여 매번 새로 생성되지 않도록 함
const userQueryOption = {
  queryKey: "users",
  queryFn: () => getUsers(),
  staleTime: 1000 * 5,
  gcTime: 1000 * 60 * 10,
};

function UserContent() {
  const { isLoading, data } = useMyQuery(userQueryOption);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User List</h2>
      {isLoading && <div>Loading User...</div>}
      {!isLoading && (
        <div className="space-y-2">
          {data?.map((user: { id: string; name: string; email: string }) => (
            <div key={user.id}>{user.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserContent;
