type RetryInput<T> = {
  operation: () => Promise<T>;
  retries: number;
  delayMs: number;
  shouldRetry?: (error: unknown) => boolean;
};

export async function retry<T>(input: RetryInput<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= input.retries; attempt += 1) {
    try {
      return await input.operation();
    } catch (error) {
      lastError = error;

      if (attempt === input.retries || input.shouldRetry?.(error) === false) {
        break;
      }

      await delay(input.delayMs * (attempt + 1));
    }
  }

  throw lastError;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
