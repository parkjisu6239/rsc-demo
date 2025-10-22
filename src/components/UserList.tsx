import UserCard from "./UserCard";

export default async function UserList() {
  const res = await fetch("https://jsonplaceholder.typicode.com/users", {
    cache: "no-store",
  });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const users = await res.json();

  return (
    <div className="space-y-2">
      {users.map((user: { id: string; name: string; email: string }) => (
        <UserCard key={user.id} name={user.name} email={user.email} />
      ))}
    </div>
  );
}
