import {Server} from '@hapi/hapi';
import constants from '@constants';
import events from "@events"
import {FreshToken, FreshTokensWithUser} from '@types';

export default {
  name: 'EventHandlerPlugin',
  register: async function (server: Server) {

    server.event(constants.events.authentication.ON_LOGIN_SUCCESSFUL);
    server.event(constants.events.authentication.ON_LOGIN_FAILED);
    server.event(constants.events.authentication.ON_LOGOUT);

    server.event(constants.events.authentication.ON_ACCESS_TOKEN_REFRESHED);

    // @ts-ignore
    server.events.on(constants.events.authentication.ON_LOGIN_SUCCESSFUL,
        (payload: unknown) => events.listeners.authentication.onLoginSuccessful(server, payload as FreshTokensWithUser),
    );

    // @ts-ignore
    server.events.on(constants.events.authentication.ON_LOGOUT,
        async (payload: unknown) => events.listeners.authentication.onLogout(server, payload as FreshToken));

    // @ts-ignore
    server.events.on(constants.events.authentication.ON_ACCESS_TOKEN_REFRESHED,
        async (payload: unknown) => events.listeners.authentication.onAccessTokenRefresh(server, payload as FreshToken)
    );
  },
};
