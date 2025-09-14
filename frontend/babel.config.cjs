module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { 
        node: 'current' 
      },
      modules: 'auto'
    }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    ['babel-plugin-transform-import-meta', {
      module: 'ES6',
      metaObjectReplacement: {
        env: {
          SERVER_URL: 'http://localhost:3001'
        }
      }
    }]
  ],
  env: {
    test: {
      plugins: [
        ['babel-plugin-transform-import-meta', {
          module: 'ES6',
          metaObjectReplacement: {
            env: {
              SERVER_URL: 'http://localhost:3001'
            }
          }
        }]
      ]
    }
  }
};