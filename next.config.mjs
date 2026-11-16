/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
    "@libsql/core",
    "@libsql/hrana-client",
    "@libsql/isomorphic-ws",
    "@libsql/isomorphic-fetch",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Seite darf nicht in fremde Seiten eingebettet werden (Clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Admin-Bereich und Export mit Adressdaten nie zwischenspeichern.
        source: "/(admin|api/admin)/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/admin",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
