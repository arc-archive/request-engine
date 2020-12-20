import { assert } from '@open-wc/testing';
import { RequestFactory } from '../index.js';
import jexl from '../web_modules/jexl/dist/Jexl.js';

describe('RequestFactory', () => {
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
});
