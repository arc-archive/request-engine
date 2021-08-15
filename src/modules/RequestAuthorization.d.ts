import { ArcEditorRequest } from "@advanced-rest-client/arc-models";
import { ExecutionContext } from "../types";

/**
 * Processes authorization data from the authorization configuration and injects data into the request object when necessary.
 * 
 * This work with the authorization-method elements.
 */
export default function processAuth(request: ArcEditorRequest, context: ExecutionContext, signal: AbortSignal): Promise<number>;
