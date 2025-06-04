export type ErrorResponse = {
  error: {
    message: string;
    details?: Record<string, string[]>;
    code: string;
  };
};
