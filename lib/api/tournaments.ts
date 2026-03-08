import { useAuthStore } from "@/lib/stores/auth-store";
import type { RecalculateRatingsRequest, RecalculateRatingsResponse } from "@/lib/types/tournament";

const DEFAULT_GATEWAY = "https://rankeao-go-gateway-production.up.railway.app";

function getGatewayBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return env.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "") || DEFAULT_GATEWAY;
}

export async function recalculateRatings(data: RecalculateRatingsRequest): Promise<RecalculateRatingsResponse> {
  const base = getGatewayBase();
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${base}/internal/tournaments/ratings/recalculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `Error ${res.status}`;
    try {
      const json = JSON.parse(text);
      message = json.message ?? json.error ?? message;
    } catch { /* use default */ }
    throw new Error(message);
  }

  return res.json();
}
