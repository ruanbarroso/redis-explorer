const { IgnorePlugin } = require('webpack');

module.exports = {
  // Configuração para ignorar módulos específicos no cliente
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignora módulos do Node.js que não estão disponíveis no navegador
      config.plugins.push(
        new IgnorePlugin({
          resourceRegExp: /^ioredis$/,
          contextRegExp: /./
        }),
        new IgnorePlugin({
          resourceRegExp: /^ioredis\//,
          contextRegExp: /./
        }),
        new IgnorePlugin({
          resourceRegExp: /^(dns|net|tls|fs|child_process|dgram)$/,
          contextRegExp: /./
        })
      );

      // Configura fallback para módulos do Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        dgram: false,
      };
    }
    return config;
  },
};
