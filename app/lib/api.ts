const BASE = process.env.NEXT_PUBLIC_API_URL || "https://hola-ride-api-v2.vercel.app";

async function request(path: string, opts: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export const api = {
  get:  (path: string, token?: string | null) => request(path, {}, token),
  post: (path: string, body: unknown, token?: string | null) =>
        request(path, { method: "POST", body: JSON.stringify(body) }, token),
  patch:(path: string, body?: unknown, token?: string | null) =>
        request(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }, token),
  del:  (path: string, token?: string | null) =>
        request(path, { method: "DELETE" }, token),
};

export const getToken = () => typeof window !== "undefined" ? localStorage.getItem("hr_tok") : null;
export const getUser  = <T=Record<string,string>>() => {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("hr_usr"); return s ? JSON.parse(s) as T : null;
};
export const saveSession = (tok: string, user: unknown) => {
  localStorage.setItem("hr_tok", tok); localStorage.setItem("hr_usr", JSON.stringify(user));
};
export const clearSession = () => { localStorage.removeItem("hr_tok"); localStorage.removeItem("hr_usr"); };

export const fmt = (v: number) => new Intl.NumberFormat("fr-CM").format(v) + " XAF";
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
export const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
export const fmtDT   = (d: string) => `${fmtDate(d)} · ${fmtTime(d)}`;
export const timeAgo = (d: string) => {
  const s = (Date.now()-new Date(d).getTime())/1000;
  if(s<60) return "Just now"; if(s<3600) return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
};