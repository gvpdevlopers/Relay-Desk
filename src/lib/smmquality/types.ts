export interface SmmQualityOrderStatus {
  charge?: string;
  start_count?: string;
  status?: string;
  remains?: string | number;
  currency?: string;
  error?: string;
}

export interface SmmQualityService {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
}