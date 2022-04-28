import {env} from '@config';
import jwt from 'jsonwebtoken';
import {
  AccessTokenPayload,
  AccessTokenUserPayload,
  FreshToken,
  FreshTokens,
  FreshTokensWithUser,
  RefreshTokenPayload,
  TokenType,
} from '@types';
import ms from 'ms';
import {v4 as uuidV4} from 'uuid';
import {Request, Server} from '@hapi/hapi';
import {UserRedisBucket} from "../plugins/jwt.plugin";


export default class {

  public generateAccessToken(payload: AccessTokenUserPayload, refreshTokenId: string): FreshToken {

    // used to revoke individual tokens
    const tokenId = uuidV4();

    const accessTokenPayload: AccessTokenPayload = {
      ...payload,
      tokenType: 'access',
      refreshTokenId
    };

    const accessToken = jwt.sign(accessTokenPayload, env.getVariable('JWT_SECRET'), {
      expiresIn: String(this.getAccessTokenExpiryDuration()),
      issuer: this.getTokenIssuer(),
      audience: [this.getTokenAudience()],
      jwtid: tokenId,
    });

    return {
      value: accessToken,
      jti: tokenId
    };
  }

  getTokenAudience() {
    return "https://retrobie.com"
  }

  getTokenIssuer() {
    return "https://api.retrobie.ocm"
  }

  generateTokens(payload: AccessTokenUserPayload,): FreshTokens {
    const refreshToken = this.generateRefreshToken(payload);
    const accessToken = this.generateAccessToken(payload, refreshToken.jti);

    return {
      accessToken,
      refreshToken
    };
  }

  getExpiryDuration(tokenType: 'access_token' | 'refresh_token') {
    if (tokenType === 'access_token') return this.getAccessTokenExpiryDuration();

    return this.getRefreshExpiryDuration();
  }

  /**
   * Validate a jwt. This method shouldn't be called directly.
   *
   * Items are stored as {id: "uuid", isActive: false | true} in the redis bucket. If the
   * jwt has been marked as "isActive: false", " it's considered invalid/revoked.
   * @param decoded
   * @param request
   */
  async validateToken(decoded: AccessTokenPayload, request: Request): Promise<{ isValid: boolean; }> {

    if (!decoded) {
      return {isValid: false};
    }

    switch (decoded.tokenType) {
      case "access":
        if (decoded.jti) {
          // Look for this token in its redis bucket
          const refreshTokenState = await request.server.methods.getAccessTokenFromBucket(
              decoded.jti
          );

          if (refreshTokenState) {
            // if token has been revoked, tokenStatus.isActive = false
            return {
              isValid: refreshTokenState.isActive
            };
          }
        }
        return {
          isValid: false
        }
      case "refresh":
        const refreshTokenStatus = await request.server.methods.getRefreshTokenFromBucket(
            decoded.jti
        );

        return {isValid: Boolean(refreshTokenStatus)};
      default:
        return {
          isValid: false
        };
    }

  }

  async addAccessTokenToBucket(server: Server, accessToken: FreshToken) {
    await server.methods.addAccessTokenToBucket({
      jwtId: accessToken.jti
    });
  }

  async addRefreshTokenToBucket(server: Server, refreshToken: FreshToken) {
    server.methods.addRefreshTokenToBucket({
      jti: refreshToken.jti
    });
  }

  async addTokensToBucket(
      server: Server,
      tokens: FreshTokensWithUser
  ) {

    await this.addAccessTokenToBucket(server, tokens.accessToken)
    await this.addRefreshTokenToBucket(server, tokens.refreshToken)

    server.methods.setLoggedInUserToBucket({
      userId: tokens.userId,
      refreshTokenId: tokens.refreshToken.jti
    });
  }

  async dropRefreshTokenFromBucket(
      server: Server,
      jti: string
  ) {
    server.methods.dropRefreshTokenFromBucket({jti})
  }

  async getRefreshTokenIdsForUser(server: Server, userId: number) {
    return server.methods.getRefreshTokensForUser(userId) as UserRedisBucket
  }

  validate(
      token: string,
      options?: {
        ignoreExpiry: boolean;
        tokenType?: TokenType;
      }
  ) {

    return jwt.verify(
        token,
        env.getVariable('JWT_SECRET'),
        {
          ignoreExpiration: options?.ignoreExpiry,
        },
        function (err, decoded) {

          if (err) {
            throw new Error("invalid access token");
          }

          if (decoded != undefined) {
            if (options?.tokenType && (decoded as AccessTokenPayload).tokenType !== options.tokenType) {
              throw new Error("Invalid access token");
            }
            return token;
          }

          throw new Error("Could not decode that token")
        }
    );
  }

  decode(token: string, options?: { ignoreExpiry: boolean }): unknown {
    try {
      return jwt.verify(token, env.getVariable('JWT_SECRET'), {
        ignoreExpiration: options?.ignoreExpiry,
      });
    } catch (e) {
      throw e;
    }
  }

  protected generateRefreshToken(payload: AccessTokenUserPayload): FreshToken {

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: payload.userId,
      tokenType: 'refresh'
    };

    const jti = uuidV4();
    const refreshToken = jwt.sign(refreshTokenPayload, env.get('JWT_SECRET'), {
      expiresIn: String(this.getRefreshExpiryDuration()),
      issuer: this.getTokenIssuer(),
      audience: [this.getTokenAudience()],
      jwtid: jti,
    });

    return {
      jti,
      value: refreshToken
    }
  }

  private getRefreshExpiryDuration(): number {
    // 1 week
    return ms('168h');
  }

  /**
   * Get the amount of time it will take for tokens to expire. 2 hours by default.
   *
   * @return number - the expiry time in ms
   */
  private getAccessTokenExpiryDuration(): number {
    const jwtExpires = env.get('JWT_EXPIRES');
    let parsedExpiry: number;

    if (jwtExpires) {
      try {
        parsedExpiry = ms(jwtExpires);
      } catch (e) {
        parsedExpiry = ms('15min');
      }
    }

    return parsedExpiry;
  }
}
