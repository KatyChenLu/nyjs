const listeners = new Map();

let installed = false;
let buffer = "";
let startAt = 0;
let lastAt = 0;
let clearTimer = null;

function reset() {
  buffer = "";
  startAt = 0;
  lastAt = 0;
  if (clearTimer) {
    window.clearTimeout(clearTimer);
    clearTimer = null;
  }
}

function emit(code) {
  listeners.forEach((handler) => {
    try {
      handler(code);
    } catch (error) {
      console.error("scanner listener error", error);
    }
  });
}

function isScannerSequence(code, duration) {
  if (!code || code.length < 6) {
    return false;
  }
  return duration <= Math.max(360, code.length * 45);
}

function flush() {
  const duration = startAt ? Date.now() - startAt : Infinity;
  const code = buffer;
  reset();
  if (isScannerSequence(code, duration)) {
    emit(code);
  }
}

function onKeydown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const now = Date.now();
  if (buffer && now - lastAt > 120) {
    reset();
  }

  if (event.key === "Enter") {
    flush();
    return;
  }

  if (["Shift", "Tab", "Escape", "CapsLock"].includes(event.key)) {
    return;
  }

  if (event.key === "Backspace") {
    buffer = buffer.slice(0, -1);
    lastAt = now;
    return;
  }

  if (event.key.length !== 1) {
    return;
  }

  if (!buffer) {
    startAt = now;
  }

  buffer += event.key;
  lastAt = now;

  if (clearTimer) {
    window.clearTimeout(clearTimer);
  }

  clearTimer = window.setTimeout(flush, 90);
}

function ensureInstalled() {
  if (installed || typeof window === "undefined") {
    return;
  }
  window.addEventListener("keydown", onKeydown, true);
  installed = true;
}

export function registerScannerListener(id, handler) {
  if (!id || typeof handler !== "function") {
    return () => {};
  }
  ensureInstalled();
  listeners.set(id, handler);
  return () => {
    listeners.delete(id);
  };
}
