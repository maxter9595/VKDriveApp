export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.(js|cjs)'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
