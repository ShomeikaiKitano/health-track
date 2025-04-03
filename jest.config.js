module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // CSS モジュールのモック
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    // 絶対パスの解決
    "^@/(.*)$": "<rootDir>/$1"
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ],
  transform: {
    // .js, .jsx ファイルを babel-jest で変換
    "^.+\\.(js|jsx)$": ["babel-jest", { presets: ["next/babel"] }]
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$'
  ]
};