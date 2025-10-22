"use client"; // 클라이언트 컴포넌트 선언

import { useState } from "react";

export default function UserCard({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="border p-2 rounded-md flex justify-between items-center">
      <div>
        <p className="font-bold">{name}</p>
        <p className="text-gray-600">{email}</p>
      </div>
      <button
        onClick={() => setLiked(!liked)}
        className={`px-3 py-1 rounded-md text-white ${
          liked ? "bg-pink-500" : "bg-gray-400"
        }`}
      >
        {liked ? "Liked" : "Like"}
      </button>
    </div>
  );
}
