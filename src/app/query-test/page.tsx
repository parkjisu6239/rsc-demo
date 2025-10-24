"use client";

import { useState } from "react";
import UserContent from "./components/UserContent";
import PostContent from "./components/PostContent";
import UserDetail from "./components/UserDetail";

function Page() {
  const [tab, setTab] = useState<"user" | "post" | "userDetail">("user");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Query Test</h1>
      <div className="flex flex-col gap-4">
        <button onClick={() => setTab("user")}>User</button>
        <button onClick={() => setTab("post")}>Post</button>
        <button onClick={() => setTab("userDetail")}>UserDetail</button>
      </div>
      {tab === "user" ? (
        <UserContent />
      ) : tab === "post" ? (
        <PostContent />
      ) : (
        <UserDetail userId="1" />
      )}
    </main>
  );
}

export default Page;
