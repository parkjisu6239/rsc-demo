// app/ssg/page.tsx
import UserList from "@/components/UserList";

// ✅ Next.js에서 기본적으로 app 디렉토리는 "Dynamic = auto"
// 이 페이지를 완전 정적으로 만들려면 다음 설정 추가
export const dynamic = "force-static";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Static Site Generation (SSG)</h1>
      <p>Generated at build time: {new Date().toISOString()}</p>

      <UserList />
    </main>
  );
}

// 빌드타이밍에 서버에서 데이터 패칭 완료
// 하위 컴포넌트에서 use-client 가 적용된 파일들만 js 로 따로 분리되어 번들링 됨
