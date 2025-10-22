import { Suspense } from "react";
import UserCard from "./UserCard";

// 각각 다른 로딩 시간을 가진 컴포넌트들
async function UserProfile({ userId }: { userId: string }) {
  console.log(`🔄 UserProfile ${userId} 시작`);
  await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초
  console.log(`✅ UserProfile ${userId} 완료`);

  return (
    <div className="p-4 border rounded">
      <h3>프로필 {userId}</h3>
      <p>사용자 상세 정보...</p>
    </div>
  );
}

async function UserPosts({ userId }: { userId: string }) {
  console.log(`🔄 UserPosts ${userId} 시작`);
  await new Promise((resolve) => setTimeout(resolve, 3000)); // 3초
  console.log(`✅ UserPosts ${userId} 완료`);

  return (
    <div className="p-4 border rounded">
      <h3>게시글 {userId}</h3>
      <p>사용자 게시글 목록...</p>
    </div>
  );
}

async function UserComments({ userId }: { userId: string }) {
  console.log(`🔄 UserComments ${userId} 시작`);
  await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5초
  console.log(`✅ UserComments ${userId} 완료`);

  return (
    <div className="p-4 border rounded">
      <h3>댓글 {userId}</h3>
      <p>사용자 댓글 목록...</p>
    </div>
  );
}

// 중첩된 Suspense 구조
export default function NestedSuspenseDemo() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">중첩된 Suspense 예시</h2>

      {/* 최상위 Suspense */}
      <Suspense fallback={<div className="p-4 bg-blue-100">🔄 사용자 데이터 로딩 중...</div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 첫 번째 사용자 */}
          <div className="border p-4">
            <h3 className="font-bold">사용자 1</h3>

            {/* 중첩된 Suspense들 */}
            <Suspense fallback={<div className="p-2 bg-green-100">🔄 프로필 로딩...</div>}>
              <UserProfile userId="1" />
            </Suspense>

            <Suspense fallback={<div className="p-2 bg-yellow-100">🔄 게시글 로딩...</div>}>
              <UserPosts userId="1" />
            </Suspense>

            <Suspense fallback={<div className="p-2 bg-red-100">🔄 댓글 로딩...</div>}>
              <UserComments userId="1" />
            </Suspense>
          </div>

          {/* 두 번째 사용자 */}
          <div className="border p-4">
            <h3 className="font-bold">사용자 2</h3>

            <Suspense fallback={<div className="p-2 bg-green-100">🔄 프로필 로딩...</div>}>
              <UserProfile userId="2" />
            </Suspense>

            <Suspense fallback={<div className="p-2 bg-yellow-100">🔄 게시글 로딩...</div>}>
              <UserPosts userId="2" />
            </Suspense>

            <Suspense fallback={<div className="p-2 bg-red-100">🔄 댓글 로딩...</div>}>
              <UserComments userId="2" />
            </Suspense>
          </div>
        </div>
      </Suspense>
    </div>
  );
}