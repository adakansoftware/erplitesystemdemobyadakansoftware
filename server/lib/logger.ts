const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log('[INFO]', ...args)
    }
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
  },
}
