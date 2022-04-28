import Joi from "joi"

export const LoginUserSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(8).required()
})

export const LoginUserResponseSchema = Joi.object({
    accessToken: Joi.string().required(),
    refreshToken: Joi.string().required(),
});

export const TokenRefreshRequestSchema = Joi.object({
    expiredToken: Joi.string().regex(/^[\w-]*\.[\w-]*\.[\w-]*$/).required()
})