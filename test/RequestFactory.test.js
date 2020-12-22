/* eslint-disable no-template-curly-in-string */
import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ArcModelEventTypes } from '@advanced-rest-client/arc-models';
import { RequestFactory } from '../index.js';
import jexl from '../web_modules/jexl/dist/Jexl.js';

describe('RequestFactory', () => {
  const generator = new DataGenerator();

  describe('constructor()', () => {
    it('sets the eventsTarget property', () => {
      const inst = new RequestFactory(window, jexl);
      assert.isTrue(inst.eventsTarget === window);
    });

    it('sets the jexl property', () => {
      const inst = new RequestFactory(window, jexl);
      assert.isTrue(inst.jexl === jexl);
    });

    it('sets the actions property', () => {
      const inst = new RequestFactory(window, jexl);
      assert.typeOf(inst.actions, 'object');
    });

    it('sets the abortControllers property', () => {
      const inst = new RequestFactory(window, jexl);
      assert.typeOf(inst.abortControllers, 'map');
      assert.equal(inst.abortControllers.size, 0);
    });
  });

  describe('abort()', () => {
    const id = 'test-id';
    let inst = /** @type RequestFactory */ (null);
    beforeEach(() => {
      inst = new RequestFactory(window, jexl);
    });

    it('does nothing when controller not found', () => {
      inst.abort(id);
    });

    it('aborts the controller', () => {
      const abortController = new AbortController();
      inst.abortControllers.set(id, abortController);
      inst.abort(id);
      assert.isTrue(abortController.signal.aborted);
    });

    it('removes the controller', () => {
      const abortController = new AbortController();
      inst.abortControllers.set(id, abortController);
      inst.abort(id);
      assert.equal(inst.abortControllers.size, 0);
    });
  });

  describe('prepareExecutionStore()', () => {
    let inst = /** @type RequestFactory */ (null);
    beforeEach(() => {
      inst = new RequestFactory(window, jexl);
    });

    it('has the basic store items', () => {
      const result = inst.prepareExecutionStore(false);
      [
        'AuthData', 'ClientCertificate', 'HostRules', 'Project', 'Request', 'RestApi',
        'UrlHistory', 'UrlIndexer', 'WSUrlHistory',
      ].forEach((name) => {
        assert.typeOf(result[name], 'object', `has the ${name} property`);
      });
    });

    it('has the environment items', () => {
      const result = inst.prepareExecutionStore(true);
      [
        'AuthData', 'ClientCertificate', 'HostRules', 'Project', 'Request', 'RestApi',
        'UrlHistory', 'UrlIndexer', 'WSUrlHistory', 'Environment', 'Variable'
      ].forEach((name) => {
        assert.typeOf(result[name], 'object', `has the ${name} property`);
      });
    });
  });

  describe('prepareExecutionEvents()', () => {
    let inst = /** @type RequestFactory */ (null);
    beforeEach(() => {
      inst = new RequestFactory(window, jexl);
    });

    [
      'ArcNavigationEvents', 'SessionCookieEvents', 'EncryptionEvents', 'GoogleDriveEvents', 'ProcessEvents', 'WorkspaceEvents',
      'RequestEvents', 'AuthorizationEvents', 'ConfigEvents',
    ].forEach((name) => {
      it(`has the ${name} property`, () => {
        const result = inst.prepareExecutionEvents();
        assert.typeOf(result[name], 'object');
      });
    });
  });

  describe('buildExecutionContext()', () => {
    let inst = /** @type RequestFactory */ (null);
    beforeEach(() => {
      inst = new RequestFactory(window, jexl);
    });

    it('has the event target', async () => {
      const result = await inst.buildExecutionContext([], { environment: null, variables: [] });
      assert.isTrue(result.eventsTarget === window);
    });

    it('has no environment info by default', async () => {
      const result = await inst.buildExecutionContext([], { environment: null, variables: [] });
      assert.isUndefined(result.environment);
    });

    it('has no events info by default', async () => {
      const result = await inst.buildExecutionContext([], { environment: null, variables: [] });
      assert.isUndefined(result.Events);
    });

    it('adds the store info', async () => {
      const result = await inst.buildExecutionContext([], { environment: null, variables: [] });
      assert.isUndefined(result.Store);
    });

    it('adds the environment info', async () => {
      const result = await inst.buildExecutionContext(['environment'], { environment: null, variables: [] });
      assert.deepEqual(result.environment, { environment: null, variables: [] });
    });

    it('adds the events info', async () => {
      const result = await inst.buildExecutionContext(['events'], { environment: null, variables: [] });
      assert.typeOf(result.Events, 'object');
    });

    it('adds the store info', async () => {
      const result = await inst.buildExecutionContext(['store'], { environment: null, variables: [] });
      assert.typeOf(result.Store, 'object');
    });
  });

  describe('processRequest()', () => {
    function variablesHandler(e) {
      e.detail.result = Promise.resolve({
        environment: null,
        variables: [
          {
            name: 'host',
            value: 'dev.api.com',
            enabled: true,
          },
          {
            name: 'pathValue',
            value: '123456789',
            enabled: true,
          },
          {
            name: 'oauthToken',
            value: '123token',
            enabled: true,
          },
          {
            name: 'bodyVariable',
            value: 'body token',
            enabled: true,
          }
        ],
        systemVariables: {
          CWS_CLIENT_ID: 'abcdefghij-abcdefghij508.apps.googleusercontent.com'
        },
      });
    }

    before(() => {
      // emulates data model for variables
      window.addEventListener(ArcModelEventTypes.Environment.current, variablesHandler);
    });

    after(() => {
      window.removeEventListener(ArcModelEventTypes.Environment.current, variablesHandler);
    });

    describe('Processing request variables', () => {
      const id = 'test-id';
      let inst = /** @type RequestFactory */ (null);
      let request;
      beforeEach(() => {
        inst = new RequestFactory(window, jexl);
        const obj = generator.generateHistoryObject({
          forcePayload: true,
        });
        obj.url = 'http://${host}/v1/path/${pathValue}';
        obj.headers += '\nx=Authorization: Bearer ${oauthToken}';
        obj.payload += '\nvariable=${bodyVariable}';

        request = {
          id,
          request: obj,
        };
      });

      it('replaces URL variables', async () => {
        const result = await inst.processRequest(request);
        assert.equal(result.request.url, 'http://dev.api.com/v1/path/123456789');
      });

      it('replaces header variables', async () => {
        const result = await inst.processRequest(request);
        assert.include(result.request.headers, 'Authorization: Bearer 123token');
      });

      it('replaces payload variables', async () => {
        const result = await inst.processRequest(request);
        assert.include(result.request.payload, 'variable=body token');
      });

      it('ignores variables processing when disabled', async () => {
        const result = await inst.processRequest(request, {
          evaluateVariables: false,
        });
        assert.equal(result.request.url, 'http://${host}/v1/path/${pathValue}');
      });

      it('uses system variables', async () => {
        request.request.url += '?id=${CWS_CLIENT_ID}';
        const result = await inst.processRequest(request);
        assert.equal(result.request.url, 'http://dev.api.com/v1/path/123456789?id=abcdefghij-abcdefghij508.apps.googleusercontent.com');
      });

      it('ignores system variables processing when disabled', async () => {
        request.request.url += '?id=${CWS_CLIENT_ID}';
        const result = await inst.processRequest(request, {
          evaluateSystemVariables: false,
        });
        assert.equal(result.request.url, 'http://dev.api.com/v1/path/123456789?id=undefined');
      });
    });
  });
});
