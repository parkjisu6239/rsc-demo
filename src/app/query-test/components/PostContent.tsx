"use client";

import { getPosts } from "@/api";
import { useMyQuery } from "@/features/my-query/QueryContext";

function PostContent() {
  const { isLoading, data } = useMyQuery({
    queryKey: "posts",
    queryFn: () => getPosts(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  if (isLoading) return <div>Loading Post...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Post List</h2>
      <div className="space-y-2">
        {data?.map((post: { id: string; title: string; body: string }) => (
          <div key={post.id}>{post.title}</div>
        ))}
      </div>
    </div>
  );
}

export default PostContent;
