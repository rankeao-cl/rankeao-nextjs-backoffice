export function getErrorMessage(error: unknown, fallback = "Error inesperado"): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
