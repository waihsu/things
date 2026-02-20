export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export const isServiceError = (value: unknown): value is ServiceError =>
  value instanceof ServiceError;
