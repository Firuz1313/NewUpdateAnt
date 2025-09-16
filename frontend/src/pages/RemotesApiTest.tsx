import { useEffect, useState } from "react";
import { remotesApi } from "@/api";

export default function RemotesApiTest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("RemotesApiTest - starting API call");
    remotesApi
      .getAll()
      .then((response) => {
        console.log("RemotesApiTest - success:", response);
        setData(response);
        setLoading(false);
      })
      .catch((err) => {
        console.error("RemotesApiTest - error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Remotes API Test</h1>
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {loading ? "YES" : "NO"}
        </div>
        <div>
          <strong>Error:</strong> {error || "NONE"}
        </div>
        <div>
          <strong>Data:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2">
            {data ? JSON.stringify(data, null, 2) : "null"}
          </pre>
        </div>
      </div>
    </div>
  );
}
