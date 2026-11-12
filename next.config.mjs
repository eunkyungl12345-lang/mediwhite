/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true, experimental: { serverActions: { bodySizeLimit: "12mb" }, outputFileTracingIncludes: { "/api/public/og": ["./assets/fonts/**"] } }, env: { NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "" }, async redirects() { return [{ source: "/guide/xray", destination: "/study/xray", permanent: false }, { source: "/guide/:slug", destination: "/study", permanent: false }, { source: "/rest/sauna", destination: "/rest?s=sauna", permanent: false }]; } };
export default nextConfig;
