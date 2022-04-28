import hapiJwt from 'hapi-auth-jwt2';
import {env} from '@config';
import {jwtHelper} from '@helpers';
import {Server} from '@hapi/hapi';
import Boom from '@hapi/boom';
import constants from '@constants';

const customErrorFunc = () => {
  throw Boom.unauthorized(constants.messages.http.UNAUTHORIZED);
};

export type UserRedisBucket = {
  tokens: string[]
}

export default {
  name: 'JwtPlugin',
  version: '1.0.0',
  async register(server: Server) {

    // @ts-ignore
    await server.register(hapiJwt)

    const accessTokenRedisBucket = server.cache({
      cache: 'retrobie_cache',
      expiresIn: jwtHelper.getExpiryDuration('access_token'),
      segment: 'access_tokens',
    });

    const refreshTokenRedisBucket = server.cache({
      cache: 'retrobie_cache',
      expiresIn: jwtHelper.getExpiryDuration('refresh_token'),
      segment: 'refresh_tokens',
    });

    const usersRedisBucket = server.cache({
      cache: 'retrobie_cache',
      expiresIn: jwtHelper.getExpiryDuration('refresh_token'),
      segment: 'users',
    });

    // Add server method to allow calling from 'addTokenToBucket' from route
    server.method('addAccessTokenToBucket', async ({jwtId}) => {
          await accessTokenRedisBucket.set(jwtId, {isActive: true}, jwtHelper.getExpiryDuration('access_token'));
        },
    );

    server.method('dropRefreshTokenFromBucket', async ({jti}) => {
          await refreshTokenRedisBucket.drop(jti);
        },
    );

    // Add server method to allow calling from 'getTokenFromBucket' from route
    server.method('getAccessTokenFromBucket', jwtId =>
        accessTokenRedisBucket.get(jwtId)
    );

    server.method('addRefreshTokenToBucket', async ({jti}) => {
          await refreshTokenRedisBucket.set(
              jti,
              {isActive: true},
              jwtHelper.getExpiryDuration('refresh_token'),
          )
        }
    );

    server.method('getRefreshTokenFromBucket', jwtId =>
        refreshTokenRedisBucket.get(jwtId)
    );

    server.method('getRefreshTokensForUser', userId =>
        usersRedisBucket.get<UserRedisBucket>(userId)
    );

    server.method('setLoggedInUserToBucket', ({userId, refreshTokenId}) => {
          usersRedisBucket.set<UserRedisBucket>(String(userId), {
            tokens: [refreshTokenId]
          });
        }
    );

    server.auth.strategy('jwt', 'jwt', {
      key: env.get('JWT_SECRET'),
      validate: jwtHelper.validateToken,
      errorFunc: customErrorFunc,
      tokenType: 'Bearer',
      verifyOptions: {
        algorithms: ['HS256'],
      },
    });

    // require jwt for all routes
    server.auth.default('jwt');
  },
};
