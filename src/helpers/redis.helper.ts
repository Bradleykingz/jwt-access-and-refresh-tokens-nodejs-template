import {env} from '@config';
import IORedis, {Redis, RedisOptions} from 'ioredis';

class RedisHelper {


  getClient(options: RedisOptions = {}): Redis {
    return new IORedis(6379, this.getRedisHost(), options);
  }

  async getItem(key: string): Promise<any> {
    const data = await this.getClient().get(key);
    if (data) {
      return JSON.parse(data);
    }
  }

  setItem(key: string, value: any) {
    return this.getClient().set(key, JSON.stringify(value), "KEEPTTL", "NX");
  }

  public getRedisHost() {
    return '0.0.0.0';
  }

  /**
   *
   * @param  {?object} options
   */
  connect(options?: RedisOptions) {
    const password = env.get('REDIS_PASSWORD');
    const client = this.getClient({
      password: !env.isDevelopment() ? password : '',
    });

    const host = this.getRedisHost();

    client.once('ready', function () {
      console.info('Connected to Redis cache at', host);
    });

    client.on('error', function (error) {
      console.error(error);
    });
    return client;
  }
}

export default RedisHelper;
