// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validate if a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id)
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateString(date: string): boolean {
  if (typeof date !== 'string') return false
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return false
  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}

/**
 * Validate time string format (HH:MM or HH:MM:SS)
 */
export function isValidTimeString(time: string): boolean {
  if (typeof time !== 'string') return false
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
  return timeRegex.test(time)
}

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return ''
  // Remove null bytes and trim whitespace
  return input.replace(/\0/g, '').trim().slice(0, maxLength)
}

/**
 * Validate if a number is within a valid range
 */
export function isValidNumber(value: unknown, min?: number, max?: number): value is number {
  if (typeof value !== 'number' || isNaN(value)) return false
  if (min !== undefined && value < min) return false
  if (max !== undefined && value > max) return false
  return true
}

/**
 * Validate day of week (0-6)
 */
export function isValidDayOfWeek(day: unknown): day is number {
  return isValidNumber(day, 0, 6)
}

/**
 * Validate activity type
 */
const VALID_ACTIVITY_TYPES = [
  'practice',
  'individual_training', 
  'group_training',
  'official_match',
  'tournament',
  'meeting'
] as const

export type ActivityType = typeof VALID_ACTIVITY_TYPES[number]

export function isValidActivityType(type: unknown): type is ActivityType {
  return typeof type === 'string' && VALID_ACTIVITY_TYPES.includes(type as ActivityType)
}

/**
 * Validate response status
 */
const VALID_RESPONSE_STATUSES = ['available', 'unavailable', 'tentative'] as const

export type ResponseStatus = typeof VALID_RESPONSE_STATUSES[number]

export function isValidResponseStatus(status: unknown): status is ResponseStatus {
  return typeof status === 'string' && VALID_RESPONSE_STATUSES.includes(status as ResponseStatus)
}

/**
 * Rate limiting helper - simple in-memory rate limiter
 * In production, use Redis or a dedicated rate limiting service
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }
  
  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    }
  }
  
  record.count++
  return { 
    allowed: true, 
    remaining: maxRequests - record.count, 
    resetIn: record.resetTime - now 
  }
}

/**
 * Clean up old rate limit entries periodically
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}
