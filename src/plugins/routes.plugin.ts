import {Server} from '@hapi/hapi';
import {authRoutes} from '@routes';
import Joi from 'joi';

const RoutesPlugin = {
  name: "RoutesPlugin",
  register: function (server: Server) {

    server.validator(Joi);

    server.route({
      path: "/up",
      method: "GET",
      handler: () => {
        return "ok"
      }
    })

    authRoutes(server);
  },
};

export default RoutesPlugin;
