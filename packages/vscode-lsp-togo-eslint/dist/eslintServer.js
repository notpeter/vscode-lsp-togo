"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const path = __importStar(require("path"));
const os_1 = require("os");
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const vscode_uri_1 = require("vscode-uri");
const customMessages_1 = require("./shared/customMessages");
const settings_1 = require("./shared/settings");
const eslint_1 = require("./eslint");
const paths_1 = require("./paths");
const diff_1 = require("./diff");
const languageDefaults_1 = __importDefault(require("./languageDefaults"));
// The connection to use. Code action requests get removed from the queue if
// canceled.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all, {
    connectionStrategy: {
        cancelUndispatched: (message) => {
            // Code actions can safely be cancel on request.
            if (node_1.Message.isRequest(message) && message.method === 'textDocument/codeAction') {
                const response = {
                    jsonrpc: message.jsonrpc,
                    id: message.id,
                    result: null
                };
                return response;
            }
            return undefined;
        }
    },
    maxParallelism: 1
});
// Set when handling the initialize request.
let clientCapabilities;
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
// The notebooks manager is using the normal document manager for the cell documents.
// So all validating will work out of the box since normal document events will fire.
const notebooks = new node_1.NotebookDocuments(documents);
function loadNodeModule(moduleName) {
    const r = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;
    try {
        return r(moduleName);
    }
    catch (err) {
        if (err.stack) {
            connection.console.error(err.stack.toString());
        }
    }
    return undefined;
}
// Some plugins call exit which will terminate the server.
// To not loose the information we sent such a behavior
// to the client.
const nodeExit = process.exit;
process.exit = ((code) => {
    const stack = new Error('stack');
    void connection.sendNotification(customMessages_1.ExitCalled.type, [code ? code : 0, stack.stack]);
    setTimeout(() => {
        nodeExit(code);
    }, 1000);
});
// Handling of uncaught exceptions hitting the event loop.
process.on('uncaughtException', (error) => {
    let message;
    if (error) {
        if (typeof error.stack === 'string') {
            message = error.stack;
        }
        else if (typeof error.message === 'string') {
            message = error.message;
        }
        else if (typeof error === 'string') {
            message = error;
        }
        if (message === undefined || message.length === 0) {
            try {
                message = JSON.stringify(error, undefined, 4);
            }
            catch (e) {
                // Should not happen.
            }
        }
    }
    // eslint-disable-next-line no-console
    console.error('Uncaught exception received.');
    if (message) {
        // eslint-disable-next-line no-console
        console.error(message);
    }
});
/**
 * Infers a file path for a given URI / TextDocument. If the document is a notebook
 * cell document it uses the file path from the notebook with a corresponding
 * extension (e.g. TypeScript -> ts)
 */
function inferFilePath(documentOrUri) {
    if (!documentOrUri) {
        return undefined;
    }
    const uri = (0, paths_1.getUri)(documentOrUri);
    if (uri.scheme === 'file') {
        return (0, paths_1.getFileSystemPath)(uri);
    }
    const notebookDocument = notebooks.findNotebookDocumentForCell(uri.toString());
    if (notebookDocument !== undefined) {
        const notebookUri = vscode_uri_1.URI.parse(notebookDocument.uri);
        if (notebookUri.scheme === 'file') {
            const filePath = (0, paths_1.getFileSystemPath)(uri);
            if (filePath !== undefined) {
                const textDocument = documents.get(uri.toString());
                if (textDocument !== undefined) {
                    const extension = languageDefaults_1.default.getExtension(textDocument.languageId);
                    if (extension !== undefined) {
                        const extname = path.extname(filePath);
                        if (extname.length === 0 && filePath[0] === '.') {
                            return `${filePath}.${extension}`;
                        }
                        else if (extname.length > 0 && extname !== extension) {
                            return `${filePath.substring(0, filePath.length - extname.length)}.${extension}`;
                        }
                    }
                }
            }
        }
    }
    return undefined;
}
eslint_1.ESLint.initialize(connection, documents, inferFilePath, loadNodeModule);
eslint_1.SaveRuleConfigs.inferFilePath = inferFilePath;
documents.onDidClose(async (event) => {
    const document = event.document;
    const uri = document.uri;
    eslint_1.ESLint.removeSettings(uri);
    eslint_1.SaveRuleConfigs.remove(uri);
    eslint_1.CodeActions.remove(uri);
    eslint_1.ESLint.unregisterAsFormatter(document);
});
function environmentChanged() {
    eslint_1.ESLint.clearSettings();
    eslint_1.RuleSeverities.clear();
    eslint_1.SaveRuleConfigs.clear();
    eslint_1.ESLint.clearFormatters();
    connection.languages.diagnostics.refresh().catch(() => {
        connection.console.error('Failed to refresh diagnostics');
    });
}
var CommandIds;
(function (CommandIds) {
    CommandIds.applySingleFix = 'eslint.applySingleFix';
    CommandIds.applySuggestion = 'eslint.applySuggestion';
    CommandIds.applySameFixes = 'eslint.applySameFixes';
    CommandIds.applyAllFixes = 'eslint.applyAllFixes';
    CommandIds.applyDisableLine = 'eslint.applyDisableLine';
    CommandIds.applyDisableFile = 'eslint.applyDisableFile';
    CommandIds.openRuleDoc = 'eslint.openRuleDoc';
})(CommandIds || (CommandIds = {}));
connection.onInitialize((params, _cancel, progress) => {
    progress.begin('Initializing ESLint Server');
    const syncKind = node_1.TextDocumentSyncKind.Incremental;
    clientCapabilities = params.capabilities;
    progress.done();
    const capabilities = {
        textDocumentSync: {
            openClose: true,
            change: syncKind,
            willSaveWaitUntil: false,
            save: {
                includeText: false
            }
        },
        workspace: {
            workspaceFolders: {
                supported: true
            }
        },
        executeCommandProvider: {
            commands: [
                CommandIds.applySingleFix,
                CommandIds.applySuggestion,
                CommandIds.applySameFixes,
                CommandIds.applyAllFixes,
                CommandIds.applyDisableLine,
                CommandIds.applyDisableFile,
                CommandIds.openRuleDoc,
            ]
        },
        diagnosticProvider: {
            identifier: 'eslint',
            interFileDependencies: false,
            workspaceDiagnostics: false
        }
    };
    if (clientCapabilities.textDocument?.codeAction?.codeActionLiteralSupport?.codeActionKind.valueSet !== undefined) {
        capabilities.codeActionProvider = {
            codeActionKinds: [node_1.CodeActionKind.QuickFix, `${node_1.CodeActionKind.SourceFixAll}.eslint`]
        };
    }
    return { capabilities };
});
connection.onInitialized(() => {
    if (clientCapabilities.workspace?.didChangeConfiguration?.dynamicRegistration === true) {
        connection.onDidChangeConfiguration((_params) => {
            environmentChanged();
        });
        void connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (clientCapabilities.workspace?.workspaceFolders === true) {
        connection.workspace.onDidChangeWorkspaceFolders((_params) => {
            environmentChanged();
        });
    }
});
const emptyDiagnosticResult = {
    kind: node_1.DocumentDiagnosticReportKind.Full,
    items: []
};
connection.languages.diagnostics.on(async (params) => {
    const document = documents.get(params.textDocument.uri);
    if (document === undefined) {
        return emptyDiagnosticResult;
    }
    const settings = await eslint_1.ESLint.resolveSettings(document);
    if (settings.validate !== settings_1.Validate.on || !eslint_1.TextDocumentSettings.hasLibrary(settings)) {
        return emptyDiagnosticResult;
    }
    try {
        const start = Date.now();
        const diagnostics = await eslint_1.ESLint.validate(document, settings);
        const timeTaken = Date.now() - start;
        void connection.sendNotification(customMessages_1.StatusNotification.type, { uri: document.uri, state: customMessages_1.Status.ok, validationTime: timeTaken });
        return {
            kind: node_1.DocumentDiagnosticReportKind.Full,
            items: diagnostics
        };
    }
    catch (err) {
        // if an exception has occurred while validating clear all errors to ensure
        // we are not showing any stale once
        if (!settings.silent) {
            let status = undefined;
            for (const handler of eslint_1.ESLint.ErrorHandlers.single) {
                status = handler(err, document, settings.library, settings);
                if (status) {
                    break;
                }
            }
            status = status || customMessages_1.Status.error;
            void connection.sendNotification(customMessages_1.StatusNotification.type, { uri: document.uri, state: status });
        }
        else {
            connection.console.info(eslint_1.ESLint.ErrorHandlers.getMessage(err, document));
            void connection.sendNotification(customMessages_1.StatusNotification.type, { uri: document.uri, state: customMessages_1.Status.ok });
        }
        return emptyDiagnosticResult;
    }
});
connection.onDidChangeWatchedFiles(async (params) => {
    // A .eslintrc has change. No smartness here.
    // Simply revalidate all file.
    eslint_1.RuleMetaData.clear();
    eslint_1.ESLint.ErrorHandlers.clearNoConfigReported();
    eslint_1.ESLint.ErrorHandlers.clearMissingModuleReported();
    eslint_1.ESLint.clearSettings(); // config files can change plugins and parser.
    eslint_1.RuleSeverities.clear();
    eslint_1.SaveRuleConfigs.clear();
    await Promise.all(params.changes.map(async (change) => {
        const fsPath = inferFilePath(change.uri);
        if (fsPath === undefined || fsPath.length === 0 || (0, paths_1.isUNC)(fsPath)) {
            return;
        }
        const dirname = path.dirname(fsPath);
        if (dirname) {
            const data = eslint_1.ESLint.ErrorHandlers.getConfigErrorReported(fsPath);
            if (data !== undefined) {
                const eslintClass = await eslint_1.ESLint.newClass(data.library, {}, data.settings);
                try {
                    await eslintClass.lintText('', { filePath: path.join(dirname, '___test___.js') });
                    eslint_1.ESLint.ErrorHandlers.removeConfigErrorReported(fsPath);
                }
                catch (error) {
                }
            }
        }
    }));
    connection.languages.diagnostics.refresh().catch(() => {
        connection.console.error('Failed to refresh diagnostics');
    });
});
class CodeActionResult {
    _actions;
    _fixAll;
    constructor() {
        this._actions = new Map();
    }
    get(ruleId) {
        let result = this._actions.get(ruleId);
        if (result === undefined) {
            result = { fixes: [], suggestions: [] };
            this._actions.set(ruleId, result);
        }
        return result;
    }
    get fixAll() {
        if (this._fixAll === undefined) {
            this._fixAll = [];
        }
        return this._fixAll;
    }
    all() {
        const result = [];
        for (const actions of this._actions.values()) {
            result.push(...actions.fixes);
            result.push(...actions.suggestions);
            if (actions.disable) {
                result.push(actions.disable);
            }
            if (actions.fixAll) {
                result.push(actions.fixAll);
            }
            if (actions.disableFile) {
                result.push(actions.disableFile);
            }
            if (actions.showDocumentation) {
                result.push(actions.showDocumentation);
            }
        }
        if (this._fixAll !== undefined) {
            result.push(...this._fixAll);
        }
        return result;
    }
    get length() {
        let result = 0;
        for (const actions of this._actions.values()) {
            result += actions.fixes.length;
        }
        return result;
    }
}
class Changes {
    values;
    uri;
    version;
    constructor() {
        this.values = new Map();
        this.uri = undefined;
        this.version = undefined;
    }
    clear(textDocument) {
        if (textDocument === undefined) {
            this.uri = undefined;
            this.version = undefined;
        }
        else {
            this.uri = textDocument.uri;
            this.version = textDocument.version;
        }
        this.values.clear();
    }
    isUsable(uri, version) {
        return this.uri === uri && this.version === version;
    }
    set(key, change) {
        this.values.set(key, change);
    }
    get(key) {
        return this.values.get(key);
    }
}
var CommandParams;
(function (CommandParams) {
    function create(textDocument, ruleId, sequence) {
        return { uri: textDocument.uri, version: textDocument.version, ruleId, sequence };
    }
    CommandParams.create = create;
    function hasRuleId(value) {
        return value.ruleId !== undefined;
    }
    CommandParams.hasRuleId = hasRuleId;
})(CommandParams || (CommandParams = {}));
const changes = new Changes();
const ESLintSourceFixAll = `${node_1.CodeActionKind.SourceFixAll}.eslint`;
connection.onCodeAction(async (params) => {
    const result = new CodeActionResult();
    const uri = params.textDocument.uri;
    const textDocument = documents.get(uri);
    if (textDocument === undefined) {
        changes.clear(textDocument);
        return result.all();
    }
    function createCodeAction(title, kind, commandId, arg, diagnostic) {
        const command = node_1.Command.create(title, commandId, arg);
        const action = node_1.CodeAction.create(title, command, kind);
        if (diagnostic !== undefined) {
            action.diagnostics = [diagnostic];
        }
        return action;
    }
    function getDisableRuleEditInsertionIndex(line, commentTags) {
        let charIndex = line.indexOf('--');
        if (charIndex < 0) {
            if (typeof commentTags === 'string') {
                return line.length;
            }
            else { // commentTags is an array containing the block comment closing and opening tags
                charIndex = line.indexOf(commentTags[1]);
                while (charIndex > 0 && line[charIndex - 1] === ' ') {
                    charIndex--;
                }
            }
        }
        else {
            while (charIndex > 1 && line[charIndex - 1] === ' ') {
                charIndex--;
            }
        }
        return charIndex;
    }
    /**
     * Prefix characters with special meaning in comment markers with a backslash
     * See also: https://github.com/microsoft/vscode-eslint/issues/1610
     */
    function escapeStringRegexp(value) {
        return value.replace(/[|{}\\()[\]^$+*?.]/g, '\\$&');
    }
    function createDisableLineTextEdit(textDocument, editInfo, indentationText) {
        const lineComment = languageDefaults_1.default.getLineComment(textDocument.languageId);
        const blockComment = languageDefaults_1.default.getBlockComment(textDocument.languageId);
        // If the concerned line is not the first line of the file
        if (editInfo.line - 1 > 0) {
            // Check previous line if there is a eslint-disable-next-line comment already present.
            const prevLine = textDocument.getText(node_1.Range.create(node_1.Position.create(editInfo.line - 2, 0), node_1.Position.create(editInfo.line - 2, node_1.uinteger.MAX_VALUE)));
            // For consistency, we ignore the settings here and use the comment style from that
            // specific line.
            const matchedLineDisable = new RegExp(`${escapeStringRegexp(lineComment)} eslint-disable-next-line`).test(prevLine);
            if (matchedLineDisable) {
                const insertionIndex = getDisableRuleEditInsertionIndex(prevLine, lineComment);
                return node_1.TextEdit.insert(node_1.Position.create(editInfo.line - 2, insertionIndex), `, ${editInfo.ruleId}`);
            }
            const matchedBlockDisable = new RegExp(`${escapeStringRegexp(blockComment[0])} eslint-disable-next-line`).test(prevLine);
            if (matchedBlockDisable) {
                const insertionIndex = getDisableRuleEditInsertionIndex(prevLine, blockComment);
                return node_1.TextEdit.insert(node_1.Position.create(editInfo.line - 2, insertionIndex), `, ${editInfo.ruleId}`);
            }
        }
        // We're creating a new disabling comment. Use the comment style given in settings.
        const commentStyle = settings.codeAction.disableRuleComment.commentStyle;
        let disableRuleContent;
        if (commentStyle === 'block') {
            disableRuleContent = `${indentationText}${blockComment[0]} eslint-disable-next-line ${editInfo.ruleId} ${blockComment[1]}${os_1.EOL}`;
        }
        else { // commentStyle === 'line'
            disableRuleContent = `${indentationText}${lineComment} eslint-disable-next-line ${editInfo.ruleId}${os_1.EOL}`;
        }
        return node_1.TextEdit.insert(node_1.Position.create(editInfo.line - 1, 0), disableRuleContent);
    }
    function createDisableSameLineTextEdit(textDocument, editInfo) {
        const lineComment = languageDefaults_1.default.getLineComment(textDocument.languageId);
        const blockComment = languageDefaults_1.default.getBlockComment(textDocument.languageId);
        const currentLine = textDocument.getText(node_1.Range.create(node_1.Position.create(editInfo.line - 1, 0), node_1.Position.create(editInfo.line - 1, node_1.uinteger.MAX_VALUE)));
        let disableRuleContent;
        let insertionIndex;
        // Check if there's already a disabling comment. If so, we ignore the settings here
        // and use the comment style from that specific line.
        const matchedLineDisable = new RegExp(`${lineComment} eslint-disable-line`).test(currentLine);
        const matchedBlockDisable = new RegExp(`${blockComment[0]} eslint-disable-line`).test(currentLine);
        if (matchedLineDisable) {
            disableRuleContent = `, ${editInfo.ruleId}`;
            insertionIndex = getDisableRuleEditInsertionIndex(currentLine, lineComment);
        }
        else if (matchedBlockDisable) {
            disableRuleContent = `, ${editInfo.ruleId}`;
            insertionIndex = getDisableRuleEditInsertionIndex(currentLine, blockComment);
        }
        else {
            // We're creating a new disabling comment.
            const commentStyle = settings.codeAction.disableRuleComment.commentStyle;
            disableRuleContent = commentStyle === 'line' ? ` ${lineComment} eslint-disable-line ${editInfo.ruleId}` : ` ${blockComment[0]} eslint-disable-line ${editInfo.ruleId} ${blockComment[1]}`;
            insertionIndex = node_1.uinteger.MAX_VALUE;
        }
        return node_1.TextEdit.insert(node_1.Position.create(editInfo.line - 1, insertionIndex), disableRuleContent);
    }
    function createDisableFileTextEdit(textDocument, editInfo) {
        // If first line contains a shebang, insert on the next line instead.
        const shebang = textDocument.getText(node_1.Range.create(node_1.Position.create(0, 0), node_1.Position.create(0, 2)));
        const line = shebang === '#!' ? 1 : 0;
        const block = languageDefaults_1.default.getBlockComment(textDocument.languageId);
        return node_1.TextEdit.insert(node_1.Position.create(line, 0), `${block[0]} eslint-disable ${editInfo.ruleId} ${block[1]}${os_1.EOL}`);
    }
    function getLastEdit(array) {
        const length = array.length;
        if (length === 0) {
            return undefined;
        }
        return array[length - 1];
    }
    const settings = await eslint_1.ESLint.resolveSettings(textDocument);
    // The file is not validated at all or we couldn't load an eslint library for it.
    if (settings.validate !== settings_1.Validate.on || !eslint_1.TextDocumentSettings.hasLibrary(settings)) {
        return result.all();
    }
    const problems = eslint_1.CodeActions.get(uri);
    // We validate on type and have no problems ==> nothing to fix.
    if (problems === undefined && settings.run === 'onType') {
        return result.all();
    }
    const only = params.context.only !== undefined && params.context.only.length > 0 ? params.context.only[0] : undefined;
    const isSource = only === node_1.CodeActionKind.Source;
    const isSourceFixAll = (only === ESLintSourceFixAll || only === node_1.CodeActionKind.SourceFixAll);
    if (isSourceFixAll || isSource) {
        if (isSourceFixAll) {
            const textDocumentIdentifier = { uri: textDocument.uri, version: textDocument.version };
            const edits = await computeAllFixes(textDocumentIdentifier, AllFixesMode.onSave);
            if (edits !== undefined) {
                result.fixAll.push(node_1.CodeAction.create(`Fix all fixable ESLint issues`, { documentChanges: [node_1.TextDocumentEdit.create(textDocumentIdentifier, edits)] }, ESLintSourceFixAll));
            }
        }
        else if (isSource) {
            result.fixAll.push(createCodeAction(`Fix all fixable ESLint issues`, node_1.CodeActionKind.Source, CommandIds.applyAllFixes, CommandParams.create(textDocument)));
        }
        return result.all();
    }
    if (problems === undefined) {
        return result.all();
    }
    const fixes = new eslint_1.Fixes(problems);
    if (fixes.isEmpty()) {
        return result.all();
    }
    let documentVersion = -1;
    const allFixableRuleIds = [];
    const kind = only ?? node_1.CodeActionKind.QuickFix;
    for (const editInfo of fixes.getScoped(params.context.diagnostics)) {
        documentVersion = editInfo.documentVersion;
        const ruleId = editInfo.ruleId;
        allFixableRuleIds.push(ruleId);
        if (eslint_1.Problem.isFixable(editInfo)) {
            const workspaceChange = new node_1.WorkspaceChange();
            workspaceChange.getTextEditChange({ uri, version: documentVersion }).add(eslint_1.FixableProblem.createTextEdit(textDocument, editInfo));
            changes.set(`${CommandIds.applySingleFix}:${ruleId}`, workspaceChange);
            const action = createCodeAction(editInfo.label, kind, CommandIds.applySingleFix, CommandParams.create(textDocument, ruleId), editInfo.diagnostic);
            action.isPreferred = true;
            result.get(ruleId).fixes.push(action);
        }
        if (eslint_1.Problem.hasSuggestions(editInfo)) {
            editInfo.suggestions.forEach((suggestion, suggestionSequence) => {
                const workspaceChange = new node_1.WorkspaceChange();
                workspaceChange.getTextEditChange({ uri, version: documentVersion }).add(eslint_1.SuggestionsProblem.createTextEdit(textDocument, suggestion));
                changes.set(`${CommandIds.applySuggestion}:${ruleId}:${suggestionSequence}`, workspaceChange);
                const action = createCodeAction(`${suggestion.desc} (${editInfo.ruleId})`, node_1.CodeActionKind.QuickFix, CommandIds.applySuggestion, CommandParams.create(textDocument, ruleId, suggestionSequence), editInfo.diagnostic);
                result.get(ruleId).suggestions.push(action);
            });
        }
        if (settings.codeAction.disableRuleComment.enable && ruleId !== eslint_1.RuleMetaData.unusedDisableDirectiveId) {
            let workspaceChange = new node_1.WorkspaceChange();
            if (settings.codeAction.disableRuleComment.location === 'sameLine') {
                workspaceChange.getTextEditChange({ uri, version: documentVersion }).add(createDisableSameLineTextEdit(textDocument, editInfo));
            }
            else {
                const lineText = textDocument.getText(node_1.Range.create(node_1.Position.create(editInfo.line - 1, 0), node_1.Position.create(editInfo.line - 1, node_1.uinteger.MAX_VALUE)));
                const matches = /^([ \t]*)/.exec(lineText);
                const indentationText = matches !== null && matches.length > 0 ? matches[1] : '';
                workspaceChange.getTextEditChange({ uri, version: documentVersion }).add(createDisableLineTextEdit(textDocument, editInfo, indentationText));
            }
            changes.set(`${CommandIds.applyDisableLine}:${ruleId}`, workspaceChange);
            result.get(ruleId).disable = createCodeAction(`Disable ${ruleId} for this line`, kind, CommandIds.applyDisableLine, CommandParams.create(textDocument, ruleId));
            if (result.get(ruleId).disableFile === undefined) {
                workspaceChange = new node_1.WorkspaceChange();
                workspaceChange.getTextEditChange({ uri, version: documentVersion }).add(createDisableFileTextEdit(textDocument, editInfo));
                changes.set(`${CommandIds.applyDisableFile}:${ruleId}`, workspaceChange);
                result.get(ruleId).disableFile = createCodeAction(`Disable ${ruleId} for the entire file`, kind, CommandIds.applyDisableFile, CommandParams.create(textDocument, ruleId));
            }
        }
        if (settings.codeAction.showDocumentation.enable && result.get(ruleId).showDocumentation === undefined) {
            if (eslint_1.RuleMetaData.hasRuleId(ruleId)) {
                result.get(ruleId).showDocumentation = createCodeAction(`Show documentation for ${ruleId}`, kind, CommandIds.openRuleDoc, CommandParams.create(textDocument, ruleId));
            }
        }
    }
    if (result.length > 0) {
        const sameProblems = new Map(allFixableRuleIds.map(s => [s, []]));
        for (const editInfo of fixes.getAllSorted()) {
            if (documentVersion === -1) {
                documentVersion = editInfo.documentVersion;
            }
            if (sameProblems.has(editInfo.ruleId)) {
                const same = sameProblems.get(editInfo.ruleId);
                if (!eslint_1.Fixes.overlaps(getLastEdit(same), editInfo)) {
                    same.push(editInfo);
                }
            }
        }
        sameProblems.forEach((same, ruleId) => {
            if (same.length > 1) {
                const sameFixes = new node_1.WorkspaceChange();
                const sameTextChange = sameFixes.getTextEditChange({ uri, version: documentVersion });
                same.map(fix => eslint_1.FixableProblem.createTextEdit(textDocument, fix)).forEach(edit => sameTextChange.add(edit));
                changes.set(CommandIds.applySameFixes, sameFixes);
                result.get(ruleId).fixAll = createCodeAction(`Fix all ${ruleId} problems`, kind, CommandIds.applySameFixes, CommandParams.create(textDocument));
            }
        });
        result.fixAll.push(createCodeAction(`Fix all auto-fixable problems`, kind, CommandIds.applyAllFixes, CommandParams.create(textDocument)));
    }
    return result.all();
});
var AllFixesMode;
(function (AllFixesMode) {
    AllFixesMode["onSave"] = "onsave";
    AllFixesMode["format"] = "format";
    AllFixesMode["command"] = "command";
})(AllFixesMode || (AllFixesMode = {}));
async function computeAllFixes(identifier, mode) {
    const uri = identifier.uri;
    const textDocument = documents.get(uri);
    if (textDocument === undefined || identifier.version !== textDocument.version) {
        return undefined;
    }
    const settings = await eslint_1.ESLint.resolveSettings(textDocument);
    if (settings.validate !== settings_1.Validate.on || !eslint_1.TextDocumentSettings.hasLibrary(settings) || (mode === AllFixesMode.format && !settings.format)) {
        return [];
    }
    const filePath = inferFilePath(textDocument);
    const problems = eslint_1.CodeActions.get(uri);
    const originalContent = textDocument.getText();
    let start = Date.now();
    // Only use known fixes when running in onSave mode. See https://github.com/microsoft/vscode-eslint/issues/871
    // for details
    if (mode === AllFixesMode.onSave && settings.codeActionOnSave.mode === settings_1.CodeActionsOnSaveMode.problems) {
        const result = problems !== undefined && problems.size > 0
            ? new eslint_1.Fixes(problems).getApplicable().map(fix => eslint_1.FixableProblem.createTextEdit(textDocument, fix))
            : [];
        connection.tracer.log(`Computing all fixes took: ${Date.now() - start} ms.`);
        return result;
    }
    else {
        const saveConfig = filePath !== undefined && mode === AllFixesMode.onSave ? await eslint_1.SaveRuleConfigs.get(uri, settings) : undefined;
        const offRules = saveConfig?.offRules;
        let overrideConfig;
        if (offRules !== undefined) {
            overrideConfig = { rules: Object.create(null) };
            for (const ruleId of offRules) {
                overrideConfig.rules[ruleId] = 'off';
            }
        }
        return eslint_1.ESLint.withClass(async (eslintClass) => {
            // Don't use any precomputed fixes since neighbour fixes can produce incorrect results.
            // See https://github.com/microsoft/vscode-eslint/issues/1745
            const result = [];
            const reportResults = await eslintClass.lintText(originalContent, { filePath });
            connection.tracer.log(`Computing all fixes took: ${Date.now() - start} ms.`);
            if (Array.isArray(reportResults) && reportResults.length === 1 && reportResults[0].output !== undefined) {
                const fixedContent = reportResults[0].output;
                start = Date.now();
                const diffs = (0, diff_1.stringDiff)(originalContent, fixedContent, false);
                connection.tracer.log(`Computing minimal edits took: ${Date.now() - start} ms.`);
                for (const diff of diffs) {
                    result.push({
                        range: {
                            start: textDocument.positionAt(diff.originalStart),
                            end: textDocument.positionAt(diff.originalStart + diff.originalLength)
                        },
                        newText: fixedContent.substr(diff.modifiedStart, diff.modifiedLength)
                    });
                }
            }
            return result;
        }, settings, overrideConfig !== undefined ? { fix: true, overrideConfig } : { fix: true });
    }
}
connection.onExecuteCommand(async (params) => {
    let workspaceChange;
    const commandParams = params.arguments[0];
    if (params.command === CommandIds.applyAllFixes) {
        const edits = await computeAllFixes(commandParams, AllFixesMode.command);
        if (edits !== undefined && edits.length > 0) {
            workspaceChange = new node_1.WorkspaceChange();
            const textChange = workspaceChange.getTextEditChange(commandParams);
            edits.forEach(edit => textChange.add(edit));
        }
    }
    else {
        if ([CommandIds.applySingleFix, CommandIds.applyDisableLine, CommandIds.applyDisableFile].indexOf(params.command) !== -1) {
            workspaceChange = changes.get(`${params.command}:${commandParams.ruleId}`);
        }
        else if ([CommandIds.applySuggestion].indexOf(params.command) !== -1) {
            workspaceChange = changes.get(`${params.command}:${commandParams.ruleId}:${commandParams.sequence}`);
        }
        else if (params.command === CommandIds.openRuleDoc && CommandParams.hasRuleId(commandParams)) {
            const url = eslint_1.RuleMetaData.getUrl(commandParams.ruleId);
            if (url) {
                void connection.sendRequest(customMessages_1.OpenESLintDocRequest.type, { url });
            }
        }
        else {
            workspaceChange = changes.get(params.command);
        }
    }
    if (workspaceChange === undefined) {
        return null;
    }
    return connection.workspace.applyEdit(workspaceChange.edit).then((response) => {
        if (!response.applied) {
            connection.console.error(`Failed to apply command: ${params.command}`);
        }
        return null;
    }, () => {
        connection.console.error(`Failed to apply command: ${params.command}`);
        return null;
    });
});
connection.onDocumentFormatting((params) => {
    const textDocument = documents.get(params.textDocument.uri);
    if (textDocument === undefined) {
        return [];
    }
    return computeAllFixes({ uri: textDocument.uri, version: textDocument.version }, AllFixesMode.format);
});
documents.listen(connection);
notebooks.listen(connection);
connection.listen();
connection.console.info(`ESLint server running in node ${process.version}`);
//# sourceMappingURL=eslintServer.js.map