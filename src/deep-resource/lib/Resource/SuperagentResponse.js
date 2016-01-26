/**
 * Created by AlexanderC on 6/10/15.
 */

'use strict';

import {Response} from './Response';
import {LambdaResponse} from './LambdaResponse';

export class SuperagentResponse extends Response {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    if (this._request.isLambda) {
      this._parseLambda();
    } else {
      this._parseExternal();
    }
  }

  /**
   * @returns {Object}
   */
  get headers() {
    if (!this._headers) {
      // rawData in this case is superagent original Response object
      this._headers = this.rawData && this.rawData.headers ? this.rawData.headers : {};
    }

    return this._headers;
  }

  /**
   * @returns {String|null}
   */
  get requestId() {
    if (!this._requestId && this.headers) {
      if (this.headers[Response.ORIGINAL_REQUEST_ID_HEADER.toLowerCase()]) {
        this._requestId = this.headers[Response.ORIGINAL_REQUEST_ID_HEADER.toLowerCase()];
      } else if (this.headers[Response.REQUEST_ID_HEADER.toLowerCase()]) {
        this._requestId = this.headers[Response.REQUEST_ID_HEADER.toLowerCase()];
      }
    }

    return this._requestId;
  }

  /**
   * @private
   */
  _parseLambda() {
    this._parseExternal();

    // check if any Lambda response available
    if (this._data && !this._error) {
      let dataObj = this._data;

      // check whether Lambda execution failed
      if (dataObj.errorMessage) {
        this._error = LambdaResponse.getPayloadError(dataObj);
      } else {
        this._data = dataObj;
      }
    }
  }

  /**
   * @private
   */
  _parseExternal() {
    let data = this._rawData;
    let error = this._rawError;

    if (error) {
      this._error = error;
    } else if (data && data.error) { // weird case...
      this._error = data.error;
    } else {
      this._data = data && data.body ? data.body : null;
    }

    // @todo: treat Response.status lack somehow else?
    if (data && data.status) {
      this._statusCode = parseInt(data.status);
    } else if (this._data && !this._error) {
      this._statusCode = 200;
    } else {
      this._statusCode = 500;
    }
  }
}
