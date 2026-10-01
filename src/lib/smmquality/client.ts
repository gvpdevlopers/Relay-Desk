import type {
  SmmQualityOrderStatus,
  SmmQualityService,
} from "./types";

const SMMQUALITY_API_URL =
  process.env.SMMQUALITY_API_URL ??
  "https://www.smmquality.com/api/v2";

const SMMQUALITY_API_KEY = process.env.SMMQUALITY_API_KEY;

if (!SMMQUALITY_API_KEY) {
  console.warn(
    "[SMMQuality] SMMQUALITY_API_KEY is not configured.",
  );
}

type SmmQualityRequest = Record<string, string | number>;

export async function smmQualityRequest<T>(
  data: SmmQualityRequest,
): Promise<T> {
  if (!SMMQUALITY_API_KEY) {
    throw new Error(
      "SMMQuality API key is not configured on the server.",
    );
  }

  const response = await fetch(SMMQUALITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: SMMQUALITY_API_KEY,
      ...data,
    }),
  });

  const text = await response.text();

  let result: unknown;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `SMMQuality returned invalid JSON. HTTP ${response.status}.`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `SMMQuality API returned HTTP ${response.status}.`,
    );
  }

  return result as T;
}

export async function getOrderStatus(
  orderId: string,
): Promise<SmmQualityOrderStatus> {
  return smmQualityRequest<SmmQualityOrderStatus>({
    action: "status",
    order: orderId,
  });
}

export async function getMultipleOrderStatus(
  orderIds: string[],
): Promise<Record<string, SmmQualityOrderStatus>> {
  return smmQualityRequest<Record<string, SmmQualityOrderStatus>>({
    action: "status",
    orders: orderIds.join(","),
  });
}

export async function getServices(): Promise<SmmQualityService[]> {
  return smmQualityRequest<SmmQualityService[]>({
    action: "services",
  });
}
export async function getService(
  serviceId: number,
): Promise<SmmQualityService | null> {
  const services = await getServices();

  return (
    services.find(
      (service) => service.service === serviceId,
    ) ?? null
  );
}