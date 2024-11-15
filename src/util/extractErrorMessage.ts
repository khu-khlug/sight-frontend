import { isAxiosError } from "axios";

export function extractErrorMessage(error: Error) {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? error.message;
  }

  return error.message;
}
