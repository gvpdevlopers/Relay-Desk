import type { SmmQualityService } from "./types";

interface ServicesResponse {
  success: boolean;
  services?: SmmQualityService[];
  error?: string;
}

export async function fetchSmmQualityServices(): Promise<
  SmmQualityService[]
> {
  const response = await fetch(
    "/api/smmquality/services",
  );

  const data =
    (await response.json()) as ServicesResponse;

  if (!response.ok || !data.success) {
    throw new Error(
      data.error ??
        "Unable to fetch SMMQuality services.",
    );
  }

  return data.services ?? [];
}