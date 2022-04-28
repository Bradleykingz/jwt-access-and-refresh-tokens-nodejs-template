import {Request, Server} from '@hapi/hapi';
import {authController} from '@controllers';
import * as validation from '@validation';

export default (server: Server) => {
  server.route({
    path: '/auth/login',
    method: 'POST',
    options: {
      description: 'Log into an account',
      notes: 'Logs a user in by their email/password',
      tags: ['api', 'Authentication'],
      auth: false,
      validate: {
        payload: validation.user.LoginUserSchema,
      }
    },
    handler: async (request, h) => await authController.loginUser(
        request,
        h,
    ),
  });

  server.route({
    path: '/auth/session/refresh',
    method: 'POST',
    options: {
      auth: false,
      state: {
        parse: true,
        failAction: 'error'
      },
      validate: {
        payload: validation.user.TokenRefreshRequestSchema,
      },
      tags: ['api', 'Authentication'],
    },
    handler: async req => await authController.refreshAccessToken(req)
  });

  server.route({
    path: "/security/users/{id}/tokens/refresh/revoke",
    method: "POST",
    handler: async (req: Request) =>
        await authController.revokeTokensForUser(
            req.server,
            req.payload as { userId: number }
        )
  });
};
