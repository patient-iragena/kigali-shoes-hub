import type { NextConfig } from 'next';
 
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Lets the dev server accept requests coming through the ngrok tunnel
  // during IntouchPay sandbox testing. Only affects `npm run dev` locally -
  // has no effect on your live production site.
  allowedDevOrigins: ['gothic-colonial-ground.ngrok-free.dev'],
};
 
export default nextConfig;
 