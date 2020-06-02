const pino = require('pino');
const { ApiPromise, WsProvider } = require('@polkadot/api');
// const { Pool } = require('pg');
const { wait } = require('./utils.js');

const logger = pino();

class GetPolkaData {
  constructor(config) {
    this.config = config;
    this.nodeisSyncing = true;
  }

  async runCrawlers() {
    logger.info('Getting PolkaData, waiting 15s...');
    await wait(15000);

    // const pool = await this.getPool();

    let api = await this.getPolkadotAPI();

    logger.info('Running crawlers');
    logger.info(this.config.crawlers)

    this.config.crawlers
      .filter(crawler => crawler.enabled)
      .forEach(crawler => crawler.module.start(api));
  }

  async getPolkadotAPI() {
    logger.info(`Connecting to ${this.config.wsProviderUrl}`);

    const provider = new WsProvider(this.config.wsProviderUrl);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    logger.info('API is ready!');
    return api;
  }
}

module.exports = GetPolkaData;