export type FreshToken = {
    value: string,
    jti: string
}

export type FreshTokens = {
    accessToken: FreshToken
    refreshToken: FreshToken
};

export type FreshTokensWithUser = FreshTokens & {
    userId: number
}

export type Role = 'ROLE_ADMIN' | 'ROLE_USER'

export type TokenType = 'access' | 'refresh';

export type RegisterdClaims = {
    iat: number;
    exp: number;
    aud: [string];
    iss: string;
    jti: string;
}

// make registered claims partial so we don't have to provide them when creating
// new objects
export type TokenPayload = Partial<RegisterdClaims> & {
    tokenType: TokenType;
}

export interface AccessTokenUserPayload {
    isVerified: boolean;
    role: Role;
    username: string;
    userId: number;
}

export type AccessTokenPayload = TokenPayload & AccessTokenUserPayload & {
    refreshTokenId: string;
}

export type RefreshTokenPayload = TokenPayload & {
    userId: number
}

export type UserLoginRequestPayload = {
    username: string;
    password: string;
}

export type UserLoginResponsePayload = {
    user: Omit<UserType, "hashedPassword">,
    tokens: FreshTokens
}

export type TokenRedisState = {
    isActive: boolean
}

export type ServiceResultType<T> =
    | ServiceResultSuccess<T>
    | ServiceResultFail<T>
    | ServiceResultError;

export interface ServiceResultError {
    status: 'error';
    // every error must have a message.
    message: string;
    // The error that caused this process to fail. Useful for debugging.
    cause?: Error;
}

export interface ServiceResultFail<T> {
    // a friendly, predictable message about why the error failed
    message: string;
    // the errors, formatted nicely
    errors: Array<ResponseError>;
    status: 'fail';
    code?: 'NOT_FOUND' | 'INPUT_ERROR' | 'NOT_ALLOWED';
}

export interface ServiceResultSuccess<T> {
    message?: string;
    data: T;
    status: 'success';
}

export type ResponseError = {
    path?: any;
    message: string;
    value?: any;
}

export type UserType = {
    id: number;
    username: string;
    isVerified: boolean;
    hashedPassword: string;
    role: Role;
}
