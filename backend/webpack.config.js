const path = require('path');

module.exports = (options, webpack) => {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
  ];

  return {
    ...options,
    // Definindo externals explicitamente como um objeto com as entradas problemáticas.
    externals: {
      bcrypt: 'commonjs bcrypt',
      '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
      'aws-sdk': 'commonjs aws-sdk',
      nock: 'commonjs nock',
      'mock-aws-s3': 'commonjs mock-aws-s3',
    },
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve.alias,
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
  };
};