export interface ListMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  path: string;

  constructor(message: string, status: number, path: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.path = path;
  }
}
