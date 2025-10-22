import { use, Suspense } from "react";

// Promise를 반환하는 함수들
async function fetchUser(userId: string) {
  console.log(`🔄 fetchUser ${userId} 시작`);
  await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초
  console.log(`✅ fetchUser ${userId} 완료`);

  return {
    id: userId,
    name: `사용자 ${userId}`,
    email: `user${userId}@example.com`,
    avatar: `아바타 ${userId}`,
  };
}

async function fetchUserPosts(userId: string) {
  console.log(`🔄 fetchUserPosts ${userId} 시작`);
  await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5초
  console.log(`✅ fetchUserPosts ${userId} 완료`);

  return [
    { id: 1, title: `게시글 1 (${userId})`, content: "내용..." },
    { id: 2, title: `게시글 2 (${userId})`, content: "내용..." },
  ];
}

// use 훅을 사용하는 컴포넌트
function UserProfile({ userId }: { userId: string }) {
  // use 훅으로 Promise 직접 사용
  const user = use(fetchUser(userId));

  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>
      <div className="w-12 h-12 bg-blue-500 rounded-full mt-2">
        {user.avatar}
      </div>
    </div>
  );
}

function UserPosts({ userId }: { userId: string }) {
  // use 훅으로 Promise 직접 사용
  const posts = use(fetchUserPosts(userId));

  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold">게시글 목록</h3>
      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} className="p-2 bg-gray-100 rounded">
            <h4 className="font-medium">{post.title}</h4>
            <p className="text-sm text-gray-600">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 중첩된 use 훅 사용
function UserCard({ userId }: { userId: string }) {
  // 첫 번째 use 훅
  const user = use(fetchUser(userId));

  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>

      {/* 중첩된 Suspense로 posts 로딩 */}
      <Suspense
        fallback={<div className="p-2 bg-yellow-100">🔄 게시글 로딩...</div>}
      >
        <UserPosts userId={userId} />
      </Suspense>
    </div>
  );
}

// 메인 컴포넌트
export default function UseHookDemo() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">React use 훅 + Suspense</h2>

      {/* 단일 use 훅 */}
      <Suspense
        fallback={
          <div className="p-4 bg-blue-100">🔄 사용자 프로필 로딩...</div>
        }
      >
        <UserProfile userId="1" />
      </Suspense>

      {/* 중첩된 use 훅 */}
      <Suspense
        fallback={
          <div className="p-4 bg-green-100">🔄 사용자 카드 로딩...</div>
        }
      >
        <UserCard userId="2" />
      </Suspense>

      {/* 병렬 use 훅들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Suspense
          fallback={<div className="p-4 bg-red-100">🔄 사용자 3 로딩...</div>}
        >
          <UserProfile userId="3" />
        </Suspense>

        <Suspense
          fallback={
            <div className="p-4 bg-purple-100">🔄 사용자 4 로딩...</div>
          }
        >
          <UserProfile userId="4" />
        </Suspense>
      </div>
    </div>
  );
}