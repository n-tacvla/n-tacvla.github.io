// The same source works at / locally and /N-TacVLA/ on GitHub Pages.
export function assetUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${path.replace(/^\/+/, '')}`;
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clearlove-yu.github.io/N-TacVLA/';
