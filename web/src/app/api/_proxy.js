import { getClientIp } from "./lib/getClientIP";

export async function proxy(request, url, options = {}) {
  const ip = getClientIp(request);

  const headers = {
    "Content-Type": "application/json",
    "appToken": process.env.APP_TOKEN,
    "x-client-ip": ip,
    ...(options.headers || {})
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
