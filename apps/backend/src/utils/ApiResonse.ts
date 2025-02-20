export class ApiResponse extends Response {
  httpStatusCode: number;
  httpStatus: string;
  payload: any;
  message: string;
  constructor(
    httpStatusCode: number,
    httpStatus: string,
    payload: any,
    message: string = "SUCCESS",
  ) {
    super(message);
    this.httpStatusCode = httpStatusCode;
    this.payload = payload;
    this.httpStatus = httpStatus;
    this.message=message;
  }
}

