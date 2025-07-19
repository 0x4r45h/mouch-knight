import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    webpack: (config) => {
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        };
        // these are to prevent crashing when using the Userpile component
        config.externals['@solana/web3.js'] = 'commonjs @solana/web3.js';
        config.externals['@solana/spl-token'] = 'commonjs @solana/spl-token';
        return config;
    },
};

export default nextConfig;
