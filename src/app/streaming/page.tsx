import { Suspense } from "react";
import UserList from "@/components/UserList";
import Loading from "@/components/Loading";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        React Server Components + Suspense
      </h1>

      {/* streaming ssr */}
      <Suspense fallback={<Loading />}>
        <UserList />
      </Suspense>
    </main>
  );
}

// 데이터 패칭이 완료되기 전까지는 fallback 이 표시되고, 완료되면 데이터가 표시됨
