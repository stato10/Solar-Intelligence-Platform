export type ApiVersion = "v1";

export interface ApiMeta {
  requestId?: string;
  timestamp: string;
  version: ApiVersion;
}

export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessEnvelope<TData> {
  success: true;
  data: TData;
  meta?: ApiMeta & {
    pagination?: ApiPaginationMeta;
  };
}

export interface ApiErrorEnvelope {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId?: string;
}
