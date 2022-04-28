import {jwtHelper, responseHelper} from '@helpers';
import {authService} from '@services';
import {Request, ResponseToolkit, Server} from '@hapi/hapi';
import {UserLoginRequestPayload} from '@types';
import constants from '@constants';

class AuthController {


  async loginUser(request: Request, h: ResponseToolkit) {
    const loginUserResult = await authService.loginUser(request.payload as UserLoginRequestPayload)

    switch (loginUserResult.status) {
      case 'success':
        const {tokens, user} = loginUserResult.data;

        await request.server.events.emit(constants.events.authentication.ON_LOGIN_SUCCESSFUL, {
          ...tokens,
          userId: user.id
        });

        h.state("x-refresh-token", tokens.refreshToken.value, {
          path: "/api/v1/auth/session/refresh",
          ttl: jwtHelper.getExpiryDuration("refresh_token"),
          isSecure: false
        })
        return h.response({
          accessToken: tokens.accessToken.value,
          refreshToken: tokens.refreshToken.value,
          role: "ROLE_USER"
        });
    }

    return responseHelper.returnGenericResponses(loginUserResult);
  }

  async refreshAccessToken(request: Request) {

    const refreshTokenResult = await authService.refreshAccessToken(request.server, {
      expiredToken: request.payload.expiredToken as string,
      refreshToken: request.state["x-refresh-token"] as string
    });

    switch (refreshTokenResult.status) {
      case 'success':
        const freshToken = refreshTokenResult.data;
        // link the new access token
        await request.server.events.emit(constants.events.authentication.ON_ACCESS_TOKEN_REFRESHED, freshToken);
        return {
          accessToken: freshToken.value
        }
      default:
        return responseHelper.returnGenericResponses(refreshTokenResult);
    }
  }

  async revokeAccessToken(server: Server) {

  }

  async revokeRefreshToken(server: Server) {

  }

  async revokeTokensForUser(server: Server, payload: { userId: number }) {
    await authService.revokeRefreshTokensForUser(server, payload)

    return {
      update: "ok"
    }
  }

}

export default AuthController;
