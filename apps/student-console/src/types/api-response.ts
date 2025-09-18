export type ApiResponse<T> = {
  httpStatusCode: number;
  httpStatus: string;
  payload: T;
  message: string;
};
