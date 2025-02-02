export type ApiResonse<T> = {
    httpStatusCode: number;
    httpStatus: string;
    payload: T;
    message: string;
}