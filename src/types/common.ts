export type SuccessResponse<T = void> = {
  id: string;
  message: string;
  data?: T;
};

export type ListResponse<T> = {
  items: T[];
  count: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
};
