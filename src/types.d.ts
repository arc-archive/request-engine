// import { ARCProject } from '@advanced-rest-client/arc-models';
// import { AuthMeta } from '@advanced-rest-client/arc-types/src/request/ArcRequest';

import { ArcEditorRequest, EnvironmentStateDetail } from "@advanced-rest-client/arc-models";
import * as ArcModelEvents from "@advanced-rest-client/arc-models/src/events/ArcModelEvents";
import * as Events from '@advanced-rest-client/arc-events';
import { TransportRequest } from "@advanced-rest-client/arc-types/src/request/ArcRequest";
import { ErrorResponse, Response } from "@advanced-rest-client/arc-types/src/request/ArcResponse";

export declare interface RegisteredRequestModule {
  fn: (request: ArcEditorRequest, context: ExecutionContext, signal: AbortSignal) => Promise<number>;
  permissions: string[];
}

export declare interface RegisteredResponseModule {
  fn: (request: ArcEditorRequest, executed: TransportRequest, response: Response|ErrorResponse, context: ExecutionContext, signal: AbortSignal) => Promise<number>;
  permissions: string[];
}

export declare interface ExecutionContext {
  /**
   * The event target for events
   */
  eventsTarget: EventTarget;
  /**
   * The events to use to communicate with ARC
   */
  Events?: ExecutionEvents;
  /**
   * The events to use to communicate with ARC
   */
  environment?: EnvironmentStateDetail;
  /**
   * Event based access to the ARC data store
   */
  Store?: ExecutionStore;
}

export declare interface ExecutionEvents {
  ArcNavigationEvents: Events.ArcNavigationEvents;
  SessionCookieEvents: Events.SessionCookieEvents;
  EncryptionEvents: Events.EncryptionEvents;
  GoogleDriveEvents: Events.GoogleDriveEvents;
  ProcessEvents: Events.ProcessEvents;
  WorkspaceEvents: Events.WorkspaceEvents;
  RequestEvents: Events.RequestEvents;
  AuthorizationEvents: Events.AuthorizationEvents;
  ConfigEvents: Events.ConfigEvents;
}

export declare interface ExecutionStore {
  AuthData: ArcModelEvents.AuthDataFunctions;
  ClientCertificate: ArcModelEvents.ClientCertificateFunctions;
  HostRules: ArcModelEvents.HostRulesFunctions;
  Project: ArcModelEvents.ProjectFunctions;
  Request: ArcModelEvents.RequestFunctions;
  RestApi: ArcModelEvents.RestApiFunctions;
  UrlHistory: ArcModelEvents.UrlHistoryFunctions;
  UrlIndexer: ArcModelEvents.UrlIndexerFunctions;
  WSUrlHistory: ArcModelEvents.WSUrlHistoryFunctions;
  Environment?: ArcModelEvents.EnvironmentFunctions;
  Variable?: ArcModelEvents.VariableFunctions;
}

export declare interface RequestProcessOptions {
  /**
   * Whether to run jexl to evaluate variables. Default to true.
   * @default true
   */
  evaluateVariables?: boolean;
  /**
   * Whether to override application variables with system variables
   * @default true
   */
  evaluateSystemVariables?: boolean;
}

export declare interface ResponseProcessOptions {
  /**
   * Whether to run jexl to evaluate variables. Default to true.
   * @default true
   */
  evaluateVariables?: boolean;
  /**
   * Whether to override application variables with system variables
   * @default true
   */
  evaluateSystemVariables?: boolean;
}
