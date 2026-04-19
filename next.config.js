/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // output: 'export', // 👈 Enables static export (replaces next export command)
    images: {
        unoptimized: true, // ✅ disable Next.js image optimization
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/api/:path*', // proxy to Django
            },
        ];
    },
};

module.exports = nextConfig;
