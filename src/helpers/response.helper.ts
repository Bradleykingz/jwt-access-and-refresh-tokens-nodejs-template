import ms from 'ms';
import Boom from '@hapi/boom';
import {env} from '@config';
import constants from '@constants';
import {ResponseError, ServiceResultError, ServiceResultType} from '@types';

class ResponseHelper {
  getCacheControl(
      expiresInMinutes?: number
  ): {
    expiresIn: number;
    privacy: 'private' | 'public' | 'default';
  } {
    return {
      privacy: 'private',
      expiresIn: ms(`${expiresInMinutes || 5}min`),
    };
  }

  /**
   * This method takes any {@link ServiceTypeV2} type and
   * builds appropriate response types for it,
   * @param input
   */
  returnGenericResponses<T>(input: ServiceResultType<T>) {
    switch (input.status) {
      case 'success':
        return input.data;
      case 'error':
        if (env.isProduction())
          return Boom.internal();
        return this.buildResponseError({
          code: 500,
          cause: input.cause
        })
      default:
        return this.buildResponseError({
          ...input,
          code: input.code === 'NOT_FOUND' ? 404 :
              input.code === 'INPUT_ERROR' ? 400 :
                  input.code === 'NOT_ALLOWED' ? 403 :
                      400,
        });
    }
  }

  createGenericError(e: Error): ServiceResultError {
    return {
      status: 'error',
      cause: e,
      message: constants.messages.http.INTERNAL_SERVER_ERROR
    }
  }

  /**
   * This method adds a message and list of errros to a
   * Boom object.
   * @param params
   * @private
   */
  private buildResponseError(params: {
    message?: string,
    code?: 400 | 403 | 404 | 500,
    errors?: Array<ResponseError>,
    cause?: Error
  }) {
    const {message, errors, code} = params;

    let boomMessage;

    switch (code) {
      case 403:
        boomMessage = constants.messages.http.UNAUTHORIZED;
        break;
      case 400:
        boomMessage = constants.messages.generic.GENERIC_INPUT_ERROR;
        break;
      case 500:
        boomMessage = constants.messages.http.INTERNAL_SERVER_ERROR;
        break;
      default:
      case 404:
        boomMessage = constants.messages.http.NOT_FOUND
        break;
    }

    let errorBoom = new Boom.Boom(boomMessage, {statusCode: code});

    errorBoom.output.payload = {
      ...errorBoom.output.payload,
      message: message || "",
      //@ts-ignore
      errors,
      cause: params.cause,
    };

    throw errorBoom;
  }

}

export default ResponseHelper;
