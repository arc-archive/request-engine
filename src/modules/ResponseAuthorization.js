/* eslint-disable no-continue */
import { HeadersParser } from '@advanced-rest-client/arc-headers';
import { TransportEvents } from '@advanced-rest-client/arc-events';
import ExecutionResponse from '../ExecutionResponse.js';
import applyCachedBasicAuthData, { computeUrlPath, updateCache } from './BasicAuthCache.js';

/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcEditorRequest} ArcEditorRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('../types').ExecutionContext} ExecutionContext */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} Response */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.TransportRequest} TransportRequest */

/**
 * Checks if the response require authorization and if so it returns the authorization method name for the endpoint.
 *
 * @param {Response} response The response object associated with the request
 * @return {string|undefined} Authorization method or undefined if not found or not supported.
 */
function authorizationMethodFromResponse(response) {
  if (!response.headers) {
    return undefined;
  }
  const headers = HeadersParser.toJSON(response.headers);
  const auth = headers.find((item) => item.name.toLocaleLowerCase() === 'www-authenticate');
  if (!auth || !auth.value) {
    return undefined;
  }
  const value = String(auth.value).toLowerCase();
  if (value.includes('ntlm')) {
    return 'ntlm';
  }
  if (value.includes('basic')) {
    return 'basic';
  }
  return undefined;
}

/**
 * @param {ArcBaseRequest} request 
 * @param {ExecutionContext} context 
 * @param {string} id 
 */
async function requestBasicAuthData(request, context, id) {
  await import('@advanced-rest-client/authorization-method/auth-dialog-basic.js');
  const url = computeUrlPath(request.url);
  const authInfo = await context.Store.AuthData.query(context.eventsTarget, url, request.method);
  const element = document.createElement('auth-dialog-basic');
  element.dataset.owner = id;
  if (authInfo) {
    element.username = authInfo.username;
    element.password = authInfo.password;
  }
  element.opened = true;
  document.body.appendChild(element);
  return new Promise((resolve) => {
    element.addEventListener('closed', 
    /**  
     * @param {CustomEvent} e
     */
    (e) => {
      if (e.detail.canceled || !e.detail.confirmed) {
        resolve();
      } else {
        resolve(element.serialize());
      }
      document.body.removeChild(element);
    })
  });
}

/**
 * @param {ArcBaseRequest} request 
 * @param {ExecutionContext} context 
 * @param {string} id 
 */
async function requestNtlmAuthData(request, context, id) {
  await import('@advanced-rest-client/authorization-method/auth-dialog-ntlm.js');
  const url = computeUrlPath(request.url);
  const authInfo = await context.Store.AuthData.query(context.eventsTarget, url, request.method);
  const element = document.createElement('auth-dialog-ntlm');
  element.dataset.owner = id;
  if (authInfo) {
    element.username = authInfo.username;
    element.password = authInfo.password;
    element.domain = authInfo.domain;
  }
  element.opened = true;
  document.body.appendChild(element);
  return new Promise((resolve) => {
    element.addEventListener('closed', 
    /**  
     * @param {CustomEvent} e
     */
    (e) => {
      if (e.detail.canceled || !e.detail.confirmed) {
        resolve();
      } else {
        resolve(element.serialize());
      }
      document.body.removeChild(element);
    })
  });
}

/**
 * @param {ArcBaseRequest} request 
 * @param {ExecutionContext} context 
 * @param {any} authResult
 */
async function storeAuthData(request, context, authResult) {
  if (!authResult) {
    return;
  }
  const url = computeUrlPath(request.url);
  await context.Store.AuthData.update(context.eventsTarget, url, request.method, authResult);
}

/**
 * Processes authorization data from the authorization configuration and injects data into the request object when necessary.
 * 
 * This work with the authorization-method elements.
 * 
 * @param {ArcEditorRequest} request 
 * @param {ExecutionContext} context 
 * @param {TransportRequest} executed The request reported by the transport library
 * @param {Response|ErrorResponse} response ARC response object.
 * @param {AbortSignal} signal 
 */
export default async function processAuth(request, executed, response, context, signal) {
  const { id } = request;
  const typedError = /** @type ErrorResponse */ (response);
  if (typedError.error) {
    return ExecutionResponse.OK;
  }
  if (response.status !== 401) {
    return ExecutionResponse.OK;
  }
  const method = authorizationMethodFromResponse(/** @type Response */ (response));
  if (!method) {
    return ExecutionResponse.OK;
  }
  let promise;
  if (method === 'basic') {
    promise = requestBasicAuthData(request.request, context, id);
  } else {
    promise = requestNtlmAuthData(request.request, context, id);
  }

  // closes any opened dialog.
  signal.addEventListener('abort', () => {
    const nodes = document.body.querySelectorAll(`auth-dialog-ntlm[data-owner="${id}"],auth-dialog-basic[data-owner="${id}"]`);
    Array.from(nodes).forEach((node) => { 
      // @ts-ignore
      node.close();
    });
  });
  
  let opResult = ExecutionResponse.OK;
  try {
    const result = await promise;
    if (signal.aborted) {
      return opResult;
    }
    storeAuthData(request.request, context, result);
    if (result) {
      updateCache(method, computeUrlPath(request.request.url), result);
      applyCachedBasicAuthData(request.request);
      TransportEvents.request(context.eventsTarget, request);
      opResult = ExecutionResponse.ABORT;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(e);
  }
  return opResult;
}
