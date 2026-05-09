const logEndpoint = process.env.EXPO_PUBLIC_ERROR_LOG_URL || null;

type ErrorLevel = 'info' | 'warn' | 'error' | 'fatal';

interface ErrorEvent {
  message: string;
  stack?: string;
  level: ErrorLevel;
  context?: Record<string, unknown>;
  timestamp: string;
}

const pendingErrors: ErrorEvent[] = [];
let flushing = false;

function flush() {
  if (flushing || !logEndpoint || pendingErrors.length === 0) return;
  flushing = true;
  const batch = pendingErrors.splice(0);
  fetch(logEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: batch }),
  }).catch(() => {
    // silently fail — don't create an infinite loop
  }).finally(() => { flushing = false; });
}

function enqueue(event: ErrorEvent) {
  pendingErrors.push(event);
  if (pendingErrors.length >= 10) flush();
}

export function captureError(error: unknown, level: ErrorLevel = 'error', context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const event: ErrorEvent = {
    message,
    stack,
    level,
    context,
    timestamp: new Date().toISOString(),
  };

  enqueue(event);
  console.error(`[${level.toUpperCase()}] ${message}`);
}

export function captureWarning(message: string, context?: Record<string, unknown>) {
  captureError(message, 'warn', context);
}

let originalOnError: typeof globalThis.onerror | null = null;

export function initErrorTracker() {
  if (originalOnError) return;
  originalOnError = globalThis.onerror;
  globalThis.onerror = (msg, url, line, col, err) => {
    captureError(err || msg, 'fatal', { url, line, col });
    originalOnError?.call(globalThis, msg, url, line, col, err);
  };
}
