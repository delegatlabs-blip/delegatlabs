/** @type {import("next").NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/contact", destination: "/#project", permanent: false }, { source: "/delegatlabs-home/index\\.html", destination: "/", permanent: true }];
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/delegatlabs-home/index.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
