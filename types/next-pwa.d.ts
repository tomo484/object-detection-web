declare module "next-pwa" {
  import { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: Record<string, unknown>[];
    buildExcludes?: (string | RegExp)[];
    publicExcludes?: string[];
    sw?: string;
    swSrc?: string;
  }

  function withPWA(
    pwaConfig: PWAConfig
  ): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
