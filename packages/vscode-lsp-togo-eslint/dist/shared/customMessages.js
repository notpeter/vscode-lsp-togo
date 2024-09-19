"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitCalled = exports.ShowOutputChannel = exports.ProbeFailedRequest = exports.OpenESLintDocRequest = exports.NoESLintLibraryRequest = exports.NoConfigRequest = exports.StatusNotification = exports.Status = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
var Status;
(function (Status) {
    Status[Status["ok"] = 1] = "ok";
    Status[Status["warn"] = 2] = "warn";
    Status[Status["error"] = 3] = "error";
})(Status || (exports.Status = Status = {}));
/**
 * The status notification is sent from the server to the client to
 * inform the client about server status changes.
 */
var StatusNotification;
(function (StatusNotification) {
    StatusNotification.method = 'eslint/status';
    StatusNotification.type = new vscode_languageserver_protocol_1.NotificationType(StatusNotification.method);
})(StatusNotification || (exports.StatusNotification = StatusNotification = {}));
/**
 * The NoConfigRequest is sent from the server to the client to inform
 * the client that no eslint configuration file could be found when
 * trying to lint a file.
 */
var NoConfigRequest;
(function (NoConfigRequest) {
    NoConfigRequest.method = 'eslint/noConfig';
    NoConfigRequest.type = new vscode_languageserver_protocol_1.RequestType(NoConfigRequest.method);
})(NoConfigRequest || (exports.NoConfigRequest = NoConfigRequest = {}));
/**
 * The NoESLintLibraryRequest is sent from the server to the client to
 * inform the client that no eslint library could be found when trying
 * to lint a file.
 */
var NoESLintLibraryRequest;
(function (NoESLintLibraryRequest) {
    NoESLintLibraryRequest.method = 'eslint/noLibrary';
    NoESLintLibraryRequest.type = new vscode_languageserver_protocol_1.RequestType(NoESLintLibraryRequest.method);
})(NoESLintLibraryRequest || (exports.NoESLintLibraryRequest = NoESLintLibraryRequest = {}));
/**
 * The eslint/openDoc request is sent from the server to the client to
 * ask the client to open the documentation URI for a given
 * ESLint rule.
 */
var OpenESLintDocRequest;
(function (OpenESLintDocRequest) {
    OpenESLintDocRequest.method = 'eslint/openDoc';
    OpenESLintDocRequest.type = new vscode_languageserver_protocol_1.RequestType(OpenESLintDocRequest.method);
})(OpenESLintDocRequest || (exports.OpenESLintDocRequest = OpenESLintDocRequest = {}));
/**
 * The eslint/probeFailed request is sent from the server to the client
 * to tell the client the the lint probing for a certain document has
 * failed and that there is no need to sync that document to the server
 * anymore.
 */
var ProbeFailedRequest;
(function (ProbeFailedRequest) {
    ProbeFailedRequest.method = 'eslint/probeFailed';
    ProbeFailedRequest.type = new vscode_languageserver_protocol_1.RequestType(ProbeFailedRequest.method);
})(ProbeFailedRequest || (exports.ProbeFailedRequest = ProbeFailedRequest = {}));
/**
 * The eslint/showOutputChannel notification is sent from the server to
 * the client to ask the client to reveal it's output channel.
 */
var ShowOutputChannel;
(function (ShowOutputChannel) {
    ShowOutputChannel.method = 'eslint/showOutputChannel';
    ShowOutputChannel.type = new vscode_languageserver_protocol_1.NotificationType0('eslint/showOutputChannel');
})(ShowOutputChannel || (exports.ShowOutputChannel = ShowOutputChannel = {}));
/**
 * The eslint/exitCalled notification is sent from the server to the client
 * to inform the client that a process.exit call on the server got intercepted.
 * The call was very likely made by an ESLint plugin.
 */
var ExitCalled;
(function (ExitCalled) {
    ExitCalled.method = 'eslint/exitCalled';
    ExitCalled.type = new vscode_languageserver_protocol_1.NotificationType(ExitCalled.method);
})(ExitCalled || (exports.ExitCalled = ExitCalled = {}));
//# sourceMappingURL=customMessages.js.map