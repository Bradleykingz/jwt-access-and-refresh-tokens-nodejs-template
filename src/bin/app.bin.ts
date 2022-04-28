import Server from "./server.bin";
import Bootstrap from "./bootstrap.bin"
import {env} from '@config';

const app = new Server();

app.start()
    .then(() => {
        Bootstrap.createDefaultUser()
        console.log(`Started server in the '${env.getEnvironment()}' environment`);
    })
    .catch((err: Error) => {
        console.error(err);
        process.exit(1);
    });

export default app;
