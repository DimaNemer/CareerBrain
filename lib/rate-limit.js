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

export function peekRateLimit(identifier, maxAttempts = 5) {
  const now = Date.now()
  const record = attempts.get(identifier)

  if (!record) return { limited: false }

  if (now > record.resetAt) {
    attempts.delete(identifier)
    return { limited: false }
  }

  return { limited: record.count >= maxAttempts }
}

export function recordRateLimitFailure(identifier, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const record = attempts.get(identifier)

  if (!record || now > record.resetAt) {
    attempts.set(identifier, { count: 1, resetAt: now + windowMs })
    return
  }

  record.count++
}

export function clearRateLimit(identifier) {
  attempts.delete(identifier)
}

export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp?.trim()) return realIp.trim()

  const connectingIp = request.headers.get('cf-connecting-ip')
  if (connectingIp?.trim()) return connectingIp.trim()

  return 'unknown'
}
