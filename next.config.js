/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desabilita o ESLint durante o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desabilita a verificação de tipos durante o build
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/sessions',
        destination: 'https://api.linkcallendar.com/sessions',
      },
      {
        source: '/api/clients',
        destination: 'https://api.linkcallendar.com/clients',
      },
    ];
  },
};

module.exports = nextConfig;
