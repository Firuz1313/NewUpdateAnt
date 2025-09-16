import { useRemotes } from "@/hooks/useRemotes";

export default function RemotesTest() {
  const { data, isLoading, error } = useRemotes();

  console.log("RemotesTest - data:", data);
  console.log("RemotesTest - isLoading:", isLoading);
  console.log("RemotesTest - error:", error);

  return (
    <div className="p-4 border-2 border-red-500 m-4">
      <h2 className="text-lg font-bold">RemotesTest Debug Component</h2>
      <div>Loading: {isLoading ? "YES" : "NO"}</div>
      <div>Error: {error ? error.message : "NONE"}</div>
      <div>Data: {data ? JSON.stringify(data, null, 2) : "NULL"}</div>
    </div>
  );
}
