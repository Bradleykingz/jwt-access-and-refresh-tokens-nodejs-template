import AuthenticationListener from "./authentication.listener"

const authenticationListener = new AuthenticationListener()


export default {
    listeners: {
        authentication: authenticationListener
    }
}