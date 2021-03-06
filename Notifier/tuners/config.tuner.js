// eslint-disable-next-line global-require, import/no-extraneous-dependencies, node/no-unpublished-require
process.env.NODE_ENV === 'production' || require('dotenv').config();

(process.env.CLIST_BEARER && process.env.BOT_TOKEN && process.env.CHANNEL_ID) ||
  process.exit(3);

module.exports = {
  PRODUCTION: process.env.NODE_ENV === 'production',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/hackremind',
  CLIST_BEARER: process.env.CLIST_BEARER,
  BOT_TOKEN: process.env.BOT_TOKEN,
  CHANNEL_ID: process.env.CHANNEL_ID,
  ICONS_URL: process.env.ICONS_URL
    ? `${process.env.ICONS_URL}${
        process.env.ICONS_URL.endsWith('/') ? '' : '/'
      }`
    : 'https://raw.githubusercontent.com/iiitkota-codebase/hackremind/main/assets/icons/',
  ONE_PX_IMG:
    process.env.ONE_PX_IMG ||
    'https://github.com/iiitkota-codebase/hackremind/raw/main/assets/520x1-00000000.png',
  CONCURRENCY: Number(process.env.CONCURRENCY) || 4
};
