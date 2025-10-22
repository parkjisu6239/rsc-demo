import { use, Suspense } from "react";

// 에러를 발생시키는 함수들
async function fetchUserWithError(userId: string) {
  console.log(`🔄 fetchUserWithError ${userId} 시작`);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초

  // 특정 조건에서 에러 발생
  if (userId === "error") {
    console.log(`❌ fetchUserWithError ${userId} 에러 발생`);
    throw new Error(`사용자 ${userId}를 찾을 수 없습니다`);
  }

  if (userId === "network-error") {
    console.log(`❌ fetchUserWithError ${userId} 네트워크 에러`);
    throw new Error("네트워크 연결에 실패했습니다");
  }

  console.log(`✅ fetchUserWithError ${userId} 완료`);
  return {
    id: userId,
    name: `사용자 ${userId}`,
    email: `user${userId}@example.com`,
  };
}

async function fetchUserPostsWithError(userId: string) {
  console.log(`🔄 fetchUserPostsWithError ${userId} 시작`);
  await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5초

  if (userId === "posts-error") {
    console.log(`❌ fetchUserPostsWithError ${userId} 에러 발생`);
    throw new Error("게시글을 불러올 수 없습니다");
  }

  console.log(`✅ fetchUserPostsWithError ${userId} 완료`);
  return [
    { id: 1, title: `게시글 1 (${userId})`, content: "내용..." },
    { id: 2, title: `게시글 2 (${userId})`, content: "내용..." },
  ];
}

// use 훅을 사용하는 컴포넌트들
function UserProfile({ userId }: { userId: string }) {
  const user = use(fetchUserWithError(userId));

  return (
    <div className="border p-4 rounded bg-green-50">
      <h3 className="font-bold text-green-800">{user.name}</h3>
      <p className="text-green-600">{user.email}</p>
    </div>
  );
}

function UserPosts({ userId }: { userId: string }) {
  const posts = use(fetchUserPostsWithError(userId));

  return (
    <div className="border p-4 rounded bg-blue-50">
      <h3 className="font-bold text-blue-800">게시글 목록</h3>
      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} className="p-2 bg-blue-100 rounded">
            <h4 className="font-medium">{post.title}</h4>
            <p className="text-sm text-blue-600">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error Boundary 컴포넌트
function ErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: (error: Error) => React.ReactNode;
}) {
  try {
    return <>{children}</>;
  } catch (error) {
    if (error instanceof Error) {
      return <>{fallback(error)}</>;
    }
    throw error;
  }
}

// 에러 UI 컴포넌트
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="border p-4 rounded bg-red-50 border-red-200">
      <h3 className="font-bold text-red-800">❌ 에러 발생</h3>
      <p className="text-red-600">{error.message}</p>
      <button
        className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        onClick={() => window.location.reload()}
      >
        다시 시도
      </button>
    </div>
  );
}

// 메인 컴포넌트
export default function ErrorHandlingDemo() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">use 훅 에러 핸들링</h2>

      {/* 성공 케이스 */}
      <div>
        <h3 className="font-semibold mb-2">✅ 성공 케이스</h3>
        <Suspense
          fallback={<div className="p-4 bg-blue-100">🔄 사용자 로딩...</div>}
        >
          <UserProfile userId="1" />
        </Suspense>
      </div>

      {/* 에러 케이스 1: 사용자 찾을 수 없음 */}
      <div>
        <h3 className="font-semibold mb-2">❌ 에러 케이스 1: 사용자 없음</h3>
        <ErrorBoundary
          fallback={({ error }) => <ErrorFallback error={error} />}
        >
          <Suspense
            fallback={<div className="p-4 bg-blue-100">🔄 사용자 로딩...</div>}
          >
            <UserProfile userId="error" />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* 에러 케이스 2: 네트워크 에러 */}
      <div>
        <h3 className="font-semibold mb-2">❌ 에러 케이스 2: 네트워크 에러</h3>
        <ErrorBoundary
          fallback={({ error }) => <ErrorFallback error={error} />}
        >
          <Suspense
            fallback={<div className="p-4 bg-blue-100">🔄 사용자 로딩...</div>}
          >
            <UserProfile userId="network-error" />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* 중첩된 에러 케이스 */}
      <div>
        <h3 className="font-semibold mb-2">❌ 중첩된 에러 케이스</h3>
        <ErrorBoundary
          fallback={({ error }) => <ErrorFallback error={error} />}
        >
          <Suspense
            fallback={<div className="p-4 bg-blue-100">🔄 사용자 로딩...</div>}
          >
            <UserProfile userId="2" />
            <Suspense
              fallback={
                <div className="p-4 bg-yellow-100">🔄 게시글 로딩...</div>
              }
            >
              <UserPosts userId="posts-error" />
            </Suspense>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
