const attempts = new Map()

export function rateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const key = identifier

  if (!attempts.has(key)) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false }
  }

  const record = attempts.get(key)

  if (now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false }
  }

  if (record.count >= maxAttempts) {
    return { limited: true }
  }

  record.count++
  return { limited: false }
}