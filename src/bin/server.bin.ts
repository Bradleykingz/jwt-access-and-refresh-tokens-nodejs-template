import * as Glue from '@hapi/glue';
import {Server} from '@hapi/hapi';
import CatboxRedis from '@hapi/catbox-redis';
import {api} from '@config';
import {eventHandlerPlugin, jwtPlugin, routesPlugin} from '@plugins';
import {redisHelper} from '@helpers';

class RootServer {
  private manifest: Glue.Manifest = {
    server: {
      cache: [{
        name: 'retrobie_cache',
        provider: {
          constructor: CatboxRedis,
          options: {
            partition: 'retrobie_partition',
            host: redisHelper.getRedisHost(),
          },
        },
      }],
      port: 2500,
      host: 'localhost',
      router: {
        isCaseSensitive: false,
        stripTrailingSlash: true,
      },
      routes: {
        cors: {
          origin: 'ignore',
        },
        validate: {
          options: {
            abortEarly: false,
            stripUnknown: true,
          }
        },
      },
    },
    register: {
      plugins: [
        {
          plugin: jwtPlugin,
        },
        {
          plugin: eventHandlerPlugin,
        },
        {
          plugin: routesPlugin,
          routes: {
            prefix: '/api/v' + api.getVersion(),
          },
        },
      ],
    },
  };

  private options: Glue.Options = {
    relativeTo: __dirname,
  };

  /**
   * Initialize the sever. Useful during tests.
   */
  async init(): Promise<Server> {
    return this.initServer();
  }

  /**
   * Start the server.
   */
  async start(): Promise<Server> {
    return this.startServer();
  }

  /**
   * Initialize the server
   */
  private async initServer(): Promise<Server> {
    const server = await this.getServer();
    await server.initialize();
    return server;
  }

  /**
   * Get the server configuration
   */
  private async getServer(): Promise<Server> {
    return Glue.compose(this.manifest, this.options);
  }

  /**
   * Start the server.
   */
  private async startServer(): Promise<Server> {
    const server = await this.getServer();
    await server.start();
    return server;
  }
}

export default RootServer;
