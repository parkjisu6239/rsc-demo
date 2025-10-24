"use client";

import { useState } from "react";
import UserContent from "./components/UserContent";
import PostContent from "./components/PostContent";
import UserDetail from "./components/UserDetail";
import { invalidateQueries } from "@/features/my-query";

function Page() {
  const [tab, setTab] = useState<"user" | "post" | "userDetail">("user");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Query Test</h1>
      <button onClick={() => invalidateQueries("users")}>
        Invalidate Users
      </button>
      <button onClick={() => invalidateQueries("posts")}>
        Invalidate Posts
      </button>
      <button onClick={() => invalidateQueries("user-1")}>
        Invalidate UserDetail
      </button>
      <div className="flex flex-row gap-4">
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
