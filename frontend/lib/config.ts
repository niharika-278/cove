export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001";

if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "production" &&
  (API_URL.includes("localhost") || SOCKET_URL.includes("localhost"))
) {
  console.warn(
    "[Cove] NEXT_PUBLIC_API_URL or NEXT_PUBLIC_SOCKET_URL still points to localhost in a production build. Set both to your deployed backend URL."
  );
}
