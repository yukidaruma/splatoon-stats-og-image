declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production';
    readonly SPLATOON_STATS_API_URL: string;
  }
}
