import type { NextConfig } from "next";

const cspHeader = [
    "default-src 'self'",
    // unsafe-inline needed for Next.js inline scripts; unsafe-eval removed for production
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
    headers: async () => [
        {
            source: "/(.*)",
            headers: [
                { key: "Content-Security-Policy", value: cspHeader },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                {
                    key: "Strict-Transport-Security",
                    value: "max-age=63072000; includeSubDomains; preload",
                },
            ],
        },
    ],
};

export default nextConfig;
