const isProd = import.meta.env.PROD === true || import.meta.env.VITE_FORCE_PROD === 'true'

function noop(..._args: unknown[]) {
  // intentionally empty
}

const logger = {
  debug: isProd ? noop : (...args: unknown[]) => console.debug(...args),
  info: isProd ? noop : (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
}

export default logger
