/**
 * CDN Utility
 * Dynamically transforms Cloudinary URLs for maximum performance (CDN Edge Optimization).
 */

export const optimizeImage = (url, { width, height, quality = 'auto', format = 'auto' } = {}) => {
    if (!url || !url.includes('cloudinary.com')) return url;

    // Split URL to inject transformations
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    const [baseUrl, assetPath] = parts;
    const transformations = [];

    // f_auto: Best format detection (AVIF, WebP, etc.)
    if (format) transformations.push(`f_${format}`);

    // q_auto: Optimal compression vs quality
    if (quality) transformations.push(`q_${quality}`);

    // w_...: Resize to exact pixels needed
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);

    // c_limit: Don't upscale, only downscale
    transformations.push('c_limit');

    return `${baseUrl}/upload/${transformations.join(',')}/${assetPath}`;
};

export const optimizeVideo = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    // v_auto: Best codec detection, q_auto: optimal bit-rate
    return `${parts[0]}/upload/vc_auto,q_auto/${parts[1]}`;
};
