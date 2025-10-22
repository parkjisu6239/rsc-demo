import { Suspense } from "react";

// 최하위 컴포넌트들
async function UserAvatar({ userId }: { userId: string }) {
  console.log(`🔄 UserAvatar ${userId} 시작`);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초
  console.log(`✅ UserAvatar ${userId} 완료`);

  return (
    <div className="w-12 h-12 bg-blue-500 rounded-full">아바타 {userId}</div>
  );
}

async function UserStats({ userId }: { userId: string }) {
  console.log(`🔄 UserStats ${userId} 시작`);
  await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초
  console.log(`✅ UserStats ${userId} 완료`);

  return <div className="text-sm text-gray-600">팔로워: 1,234명</div>;
}

// 중간 레벨 컴포넌트 (자체 Suspense 포함)
function UserCard({ userId }: { userId: string }) {
  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold">사용자 {userId}</h3>

      {/* 하위 컴포넌트들도 각각 Suspense로 감싸기 */}
      <Suspense
        fallback={<div className="p-2 bg-blue-100">🔄 아바타 로딩...</div>}
      >
        <UserAvatar userId={userId} />
      </Suspense>

      <Suspense
        fallback={<div className="p-2 bg-green-100">🔄 통계 로딩...</div>}
      >
        <UserStats userId={userId} />
      </Suspense>
    </div>
  );
}

// UserList 컴포넌트 (1초 딜레이)
async function UserList() {
  console.log(`🔄 UserList 시작`);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 딜레이
  console.log(`✅ UserList 완료`);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UserCard userId="1" />
      <UserCard userId="2" />
    </div>
  );
}

// 최상위 컴포넌트
export default function RealNestedSuspense() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">3단계 중첩된 Suspense</h2>

      {/* 최상위 Suspense */}
      <Suspense
        fallback={
          <div className="p-4 bg-red-100">🔄 전체 사용자 리스트 로딩 중...</div>
        }
      >
        <UserList />
      </Suspense>
    </div>
  );
}
