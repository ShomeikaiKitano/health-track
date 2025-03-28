/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // SlackのトークンとチャンネルID
    // 実際のデプロイ時には環境変数から取得する
    // SLACK_TOKEN: 'xoxb-your-token-here', // 本番環境では設定する
    // SLACK_CHANNEL: 'health-reports', // 任意のチャンネル名
  }
};

module.exports = nextConfig;