import {Server} from '@hapi/hapi';
import {FreshToken, FreshTokensWithUser} from '@types';
import {jwtHelper} from '@helpers';


class AuthenticationListener {

  async onLoginSuccessful(server: Server, payload: FreshTokensWithUser) {
    try {
      await jwtHelper.addTokensToBucket(server, payload);
    } catch (e) {
      console.error(e)
    }
  }

  async onLoginUnsuccessful() {

  }

  async onLogout(server: Server, payload: FreshToken) {
    try {
      await jwtHelper.dropRefreshTokenFromBucket(server, payload.jti);
    } catch (e) {
      console.error(e)
    }
  }

  async onAccessTokenRefresh(server: Server, payload: FreshToken) {
    try {
      await jwtHelper.addAccessTokenToBucket(server, payload)
    } catch (e) {
      console.error(e);
    }
  }
}

export default AuthenticationListener;
