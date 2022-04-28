import {
    AccessTokenPayload,
    AccessTokenUserPayload,
    FreshToken,
    RefreshTokenPayload,
    ServiceResultType,
    TokenRedisState,
    UserLoginRequestPayload,
    UserLoginResponsePayload,
} from '@types';
import {jwtHelper, passwordHelper} from '@helpers';
import {Server} from "@hapi/hapi"
import {userDAO} from '@models';
import constants from "@constants"

export default class AuthService {

    async loginUser({
                        username,
                        password
                    }: UserLoginRequestPayload): Promise<ServiceResultType<UserLoginResponsePayload>> {


        // find the user by their email/username/phone number
        const user = await userDAO.findByUsername(username);

        if (user) {
            // check if the password they provided is correct
            const isPasswordCorrect = await passwordHelper.isPasswordCorrect({
                passwordToVerify: password,
                bcryptPasswordHash: user.hashedPassword,
            });

            if (isPasswordCorrect) {

                let tokens = jwtHelper.generateTokens({
                    isVerified: false,
                    role: user.role,
                    userId: user.id,
                    username: user.username,
                });

                return {
                    message: constants.messages.authentication.LOGIN_SUCCESSFUL,
                    status: 'success',
                    data: {
                        tokens,
                        user
                    },
                };
            } else {
                // todo: lock account on many wrong password requests?
                //       potential chance to flag bad actor.

                return {
                    status: 'fail',
                    errors: [
                        {
                            message: constants.messages.authentication.INCORRECT_PASSWORD,
                            path: 'password'
                        }
                    ],
                    message: constants.messages.generic.GENERIC_INPUT_ERROR,
                };
            }
        } else {
            return {
                status: 'fail',
                message: constants.messages.generic.GENERIC_INPUT_ERROR,
                errors: [
                    {
                        message: constants.messages.authentication.MISSING_ACCOUNT,
                        path: 'username'
                    }
                ]
            };
        }
    }


    async refreshAccessToken(server: Server, {
        expiredToken,
        refreshToken
    }: { expiredToken: string, refreshToken: string }): Promise<ServiceResultType<FreshToken>> {

        const refreshTokenPayload = jwtHelper.decode(refreshToken) as RefreshTokenPayload

        const refreshTokenState =
            await server.methods.getRefreshTokenFromBucket(refreshTokenPayload.jti) as TokenRedisState

        // if the refresh token exists and it's active
        if (refreshTokenState?.isActive) {

            const oldAccessTokenPayload = jwtHelper.decode(payload.expiredToken, {
                ignoreExpiry: true,
            }) as AccessTokenPayload;

            if (oldAccessTokenPayload.refreshTokenId == refreshTokenPayload.jti) {

                const newAccessTokenUser: AccessTokenUserPayload = {
                    userId: oldAccessTokenPayload.userId,
                    role: oldAccessTokenPayload.role,
                    isVerified: oldAccessTokenPayload.isVerified,
                    username: oldAccessTokenPayload.username,
                }

                // generate a new access token
                const newAccessToken = jwtHelper.generateAccessToken(newAccessTokenUser, refreshTokenPayload.jti!);

                // and return it
                return {
                    status: "success",
                    data: newAccessToken
                };
            }
        }

        return {
            status: "fail",
            message: "Invalid token",
            code: "NOT_ALLOWED",
            errors: []
        };
    }

    // stub
    async revokeAccessTokenForUser() {
    }

    async revokeRefreshTokensForUser(server: Server, {userId}: { userId: number }) {
        const refreshTokenState = await jwtHelper.getRefreshTokenIdsForUser(server, userId)

        for (const token of refreshTokenState.tokens) {
            await jwtHelper.dropRefreshTokenFromBucket(server, token);
        }
    }
};