// Organization sites use /; project sites can supply their repository prefix.
export function assetUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${path.replace(/^\/+/, '')}`;
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://n-tacvla.github.io/';
