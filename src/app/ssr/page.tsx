import UserList from "@/components/UserList";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Non-Streaming SSR</h1>
      <UserList />
    </main>
  );
}

// 모든 데이터 패칭이 완료되기 전까지 pending 상태로 대기 - 화면에 아무것도 안그려짐
