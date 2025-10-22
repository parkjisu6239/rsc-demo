"use client";

import { useEffect, useState } from "react";
import UserCard from "@/components/UserCard";

export default function CSRPage() {
  const [users, setUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);

  // csr 은 패칭을 브라우저에서 함
  const fetchData = async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/users", {
      cache: "no-store",
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const users = await res.json();
    setUsers(users);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Client Side Rendering (CSR)</h1>
      {users.length > 0 ? (
        <div className="space-y-2">
          {users.map((user: { id: string; name: string; email: string }) => (
            <UserCard key={user.id} name={user.name} email={user.email} />
          ))}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
