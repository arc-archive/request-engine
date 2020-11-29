/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import { HeadersParser } from '@advanced-rest-client/arc-headers';
import ExecutionResponse from '../ExecutionResponse.js';
import applyCachedBasicAuthData from './BasicAuthCache.js';

/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcEditorRequest} ArcEditorRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.CCAuthorization} CCAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BasicAuthorization} BasicAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.FormItem} FormItem */
/** @typedef {import('../types').ExecutionContext} ExecutionContext */

/**
 * Injects client certificate object into the request object
 * @param {ArcBaseRequest} request 
 * @param {CCAuthorization} config
 * @param {ExecutionContext} context 
 */
async function processClientCertificate(request, config, context) {
  const { id } = config;
  if (!id) {
    return;
  }
  const result = await context.Store.ClientCertificate.read(context.eventsTarget, id);
  request.clientCertificate = {
    type: result.type,
    // @ts-ignore
    cert: [result.cert],
  };
  if (result.key) {
    // @ts-ignore
    request.clientCertificate.key = [result.key];
  }
}

/**
 * Injects basic auth header into the request headers.
 * @param {ArcBaseRequest} request 
 * @param {BasicAuthorization} config 
 */
function processBasicAuth(request, config) {
  const { username, password } = config;
  if (!username) {
    return;
  }
  let headers = HeadersParser.toJSON(request.headers || '');
  const value = btoa(`${username}:${password || ''}`);
  headers = /** @type FormItem[] */ (HeadersParser.replace(headers, 'authorization', `Basic ${value}`));
  request.headers = HeadersParser.toString(headers);
}

/**
 * Injects oauth 2 auth header into the request headers.
 * @param {ArcBaseRequest} request 
 * @param {OAuth2Authorization} config 
 */
function processOAuth2(request, config) {
  const { accessToken, tokenType='Bearer', deliveryMethod='header', deliveryName='authorization' } = config;
  if (!accessToken) {
    return;
  }
  if (deliveryMethod !== 'header') {
    // TODO (pawel): add support for query parameters delivery method.
    // Because the authorization panel does not support it right now it is
    // not implemented, yet.
    return;
  }
  let headers = HeadersParser.toJSON(request.headers || '');
  const value = `${tokenType} ${accessToken}`;
  headers = /** @type FormItem[] */ (HeadersParser.replace(headers, deliveryName, value));
  request.headers = HeadersParser.toString(headers);
}

/**
 * Processes authorization data from the authorization configuration and injects data into the request object when necessary.
 * 
 * This work with the authorization-method elements.
 * 
 * @param {ArcEditorRequest} request 
 * @param {ExecutionContext} context 
 * @param {AbortSignal} signal 
 */
export default async function processAuth(request, context, signal) {
  const editorRequest = request.request;
  if (!Array.isArray(editorRequest.authorization) || !editorRequest.authorization.length) {
    return ExecutionResponse.OK;
  }
  for (const auth of editorRequest.authorization) {
    if (signal.aborted || !auth.enabled || !auth.config) {
      continue;
    }
    switch (auth.type) {
      case 'client certificate': await processClientCertificate(request.request, /** @type CCAuthorization */ (auth.config), context); break;
      case 'basic': processBasicAuth(request.request, /** @type BasicAuthorization */ (auth.config)); break;
      case 'oauth 2': processOAuth2(request.request, /** @type OAuth2Authorization */ (auth.config)); break;
      default:
    }
  }
  if (request.request.url && !/^authorization:\s?.+$/gim.test(request.request.headers || '')) {
    // Try to apply basic auth from the cached during this session values.
    applyCachedBasicAuthData(request.request);
  }
  return ExecutionResponse.OK;
}
