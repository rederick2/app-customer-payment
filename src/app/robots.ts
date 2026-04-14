import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',      // Avoid indexing API routes
        '/p/',        // Avoid indexing private client portals
        '/settings',  // Avoid indexing user settings
      ],
    },
    sitemap: 'https://quickqi.app/sitemap.xml',
  };
}
