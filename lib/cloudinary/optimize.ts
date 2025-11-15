/**
 * Cloudinary Image Optimization Utilities
 * Automatically optimizes images using Cloudinary transformations
 * These optimizations happen on Cloudinary's servers (not Vercel)
 */

/**
 * Add Cloudinary optimization parameters to an image URL
 * - f_auto: Automatic format selection (WebP, AVIF for modern browsers)
 * - q_auto: Automatic quality optimization
 * - w_1200: Max width 1200px (adjust based on your needs)
 */
export function optimizeCloudinaryImage(url: string, maxWidth: number = 1200): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  // Check if already optimized
  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url
  }

  // Insert transformations after /upload/
  return url.replace(
    '/upload/',
    `/upload/f_auto,q_auto,w_${maxWidth}/`
  )
}

/**
 * Optimize avatar images (smaller size for profile pictures)
 */
export function optimizeAvatar(url: string): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url
  }

  // Avatars: smaller size, circular crop optional
  return url.replace(
    '/upload/',
    '/upload/f_auto,q_auto,w_400,h_400,c_fill/'
  )
}

/**
 * Optimize chat/team message images
 */
export function optimizeChatImage(url: string): string {
  return optimizeCloudinaryImage(url, 800)
}
