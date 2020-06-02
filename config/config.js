require('dotenv').config();

module.exports = {
  wsProviderUrl: process.env.WS_PROVIDER_URL || 'wss://kusama-rpc.polkadot.io',
  dbUrl: process.env.DB,
  PORT: process.env.PORT,

  crawlers: [

    {
      enabled: process.env.CRAWLER_ERA_POINTS_HISTORY_ENABLE,
      module: require('../lib/crawlers/eraPointsHistory'),
    }
  ]
}