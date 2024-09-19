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
exports.ESLint = exports.CodeActions = exports.RuleSeverities = exports.SaveRuleConfigs = exports.Fixes = exports.ESLintModule = exports.SuggestionsProblem = exports.FixableProblem = exports.Problem = exports.RuleMetaData = exports.ESLintError = exports.TextDocumentSettings = void 0;
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const child_process_1 = require("child_process");
const semverParse = require("semver/functions/parse");
const semverGte = require("semver/functions/gte");
const node_1 = require("vscode-languageserver/node");
const vscode_uri_1 = require("vscode-uri");
const customMessages_1 = require("./shared/customMessages");
const settings_1 = require("./shared/settings");
const Is = __importStar(require("./is"));
const linkedMap_1 = require("./linkedMap");
const paths_1 = require("./paths");
const languageDefaults_1 = __importDefault(require("./languageDefaults"));
var TextDocumentSettings;
(function (TextDocumentSettings) {
    function hasLibrary(settings) {
        return settings.library !== undefined;
    }
    TextDocumentSettings.hasLibrary = hasLibrary;
})(TextDocumentSettings || (exports.TextDocumentSettings = TextDocumentSettings = {}));
var ESLintError;
(function (ESLintError) {
    function isNoConfigFound(error) {
        const candidate = error;
        return candidate.messageTemplate === 'no-config-found' || candidate.message === 'No ESLint configuration found.';
    }
    ESLintError.isNoConfigFound = isNoConfigFound;
})(ESLintError || (exports.ESLintError = ESLintError = {}));
var RuleMetaData;
(function (RuleMetaData) {
    // For unused eslint-disable comments, ESLint does not include a rule ID
    // nor any other metadata (although they do provide a fix). In order to
    // provide code actions for these, we create a fake rule ID and metadata.
    RuleMetaData.unusedDisableDirectiveId = 'unused-disable-directive';
    const unusedDisableDirectiveMeta = {
        docs: {
            url: 'https://eslint.org/docs/latest/use/configure/rules#report-unused-eslint-disable-comments'
        },
        type: 'directive'
    };
    const handled = new Set();
    const ruleId2Meta = new Map([[RuleMetaData.unusedDisableDirectiveId, unusedDisableDirectiveMeta]]);
    function capture(eslint, reports) {
        let rulesMetaData;
        if (eslint.isCLIEngine) {
            const toHandle = reports.filter(report => !handled.has(report.filePath));
            if (toHandle.length === 0) {
                return;
            }
            rulesMetaData = typeof eslint.getRulesMetaForResults === 'function' ? eslint.getRulesMetaForResults(toHandle) : undefined;
            toHandle.forEach(report => handled.add(report.filePath));
        }
        else {
            rulesMetaData = typeof eslint.getRulesMetaForResults === 'function' ? eslint.getRulesMetaForResults(reports) : undefined;
        }
        if (rulesMetaData === undefined) {
            return undefined;
        }
        Object.entries(rulesMetaData).forEach(([key, meta]) => {
            if (ruleId2Meta.has(key)) {
                return;
            }
            if (meta && meta.docs && Is.string(meta.docs.url)) {
                ruleId2Meta.set(key, meta);
            }
        });
    }
    RuleMetaData.capture = capture;
    function clear() {
        handled.clear();
        ruleId2Meta.clear();
        ruleId2Meta.set(RuleMetaData.unusedDisableDirectiveId, unusedDisableDirectiveMeta);
    }
    RuleMetaData.clear = clear;
    function getUrl(ruleId) {
        return ruleId2Meta.get(ruleId)?.docs?.url;
    }
    RuleMetaData.getUrl = getUrl;
    function getType(ruleId) {
        return ruleId2Meta.get(ruleId)?.type;
    }
    RuleMetaData.getType = getType;
    function hasRuleId(ruleId) {
        return ruleId2Meta.has(ruleId);
    }
    RuleMetaData.hasRuleId = hasRuleId;
    function isUnusedDisableDirectiveProblem(problem) {
        return problem.ruleId === null && problem.message.startsWith('Unused eslint-disable directive');
    }
    RuleMetaData.isUnusedDisableDirectiveProblem = isUnusedDisableDirectiveProblem;
})(RuleMetaData || (exports.RuleMetaData = RuleMetaData = {}));
var Problem;
(function (Problem) {
    function isFixable(problem) {
        return problem.edit !== undefined;
    }
    Problem.isFixable = isFixable;
    function hasSuggestions(problem) {
        return problem.suggestions !== undefined;
    }
    Problem.hasSuggestions = hasSuggestions;
})(Problem || (exports.Problem = Problem = {}));
var FixableProblem;
(function (FixableProblem) {
    function createTextEdit(document, editInfo) {
        return node_1.TextEdit.replace(node_1.Range.create(document.positionAt(editInfo.edit.range[0]), document.positionAt(editInfo.edit.range[1])), editInfo.edit.text || '');
    }
    FixableProblem.createTextEdit = createTextEdit;
})(FixableProblem || (exports.FixableProblem = FixableProblem = {}));
var SuggestionsProblem;
(function (SuggestionsProblem) {
    function createTextEdit(document, suggestion) {
        return node_1.TextEdit.replace(node_1.Range.create(document.positionAt(suggestion.fix.range[0]), document.positionAt(suggestion.fix.range[1])), suggestion.fix.text || '');
    }
    SuggestionsProblem.createTextEdit = createTextEdit;
})(SuggestionsProblem || (exports.SuggestionsProblem = SuggestionsProblem = {}));
var ESLintClass;
(function (ESLintClass) {
    function getConfigType(eslint) {
        if (eslint.isCLIEngine === true) {
            return 'eslintrc';
        }
        const configType = eslint.constructor.configType;
        return configType ?? 'eslintrc';
    }
    ESLintClass.getConfigType = getConfigType;
})(ESLintClass || (ESLintClass = {}));
var ESLintModule;
(function (ESLintModule) {
    function hasLoadESLint(value) {
        return value.loadESLint !== undefined;
    }
    ESLintModule.hasLoadESLint = hasLoadESLint;
    function hasESLintClass(value) {
        return value.ESLint !== undefined;
    }
    ESLintModule.hasESLintClass = hasESLintClass;
    function hasCLIEngine(value) {
        return value.CLIEngine !== undefined;
    }
    ESLintModule.hasCLIEngine = hasCLIEngine;
    function isFlatConfig(value) {
        const candidate = value;
        return candidate.ESLint !== undefined && candidate.isFlatConfig === true;
    }
    ESLintModule.isFlatConfig = isFlatConfig;
})(ESLintModule || (exports.ESLintModule = ESLintModule = {}));
var RuleData;
(function (RuleData) {
    function hasMetaType(value) {
        return value !== undefined && value.type !== undefined;
    }
    RuleData.hasMetaType = hasMetaType;
})(RuleData || (RuleData = {}));
var CLIEngine;
(function (CLIEngine) {
    function hasRule(value) {
        return value.getRules !== undefined;
    }
    CLIEngine.hasRule = hasRule;
})(CLIEngine || (CLIEngine = {}));
/**
 * ESLint class emulator using CLI Engine.
 */
class ESLintClassEmulator {
    cli;
    constructor(cli) {
        this.cli = cli;
    }
    get isCLIEngine() {
        return true;
    }
    async lintText(content, options) {
        return this.cli.executeOnText(content, options.filePath, options.warnIgnored).results;
    }
    async isPathIgnored(path) {
        return this.cli.isPathIgnored(path);
    }
    getRulesMetaForResults(_results) {
        if (!CLIEngine.hasRule(this.cli)) {
            return undefined;
        }
        const rules = {};
        for (const [name, rule] of this.cli.getRules()) {
            if (rule.meta !== undefined) {
                rules[name] = rule.meta;
            }
        }
        return rules;
    }
    async calculateConfigForFile(path) {
        return typeof this.cli.getConfigForFile === 'function' ? this.cli.getConfigForFile(path) : undefined;
    }
}
/**
 * Class for dealing with Fixes.
 */
class Fixes {
    edits;
    constructor(edits) {
        this.edits = edits;
    }
    static overlaps(a, b) {
        return a !== undefined && a.edit.range[1] > b.edit.range[0];
    }
    static sameRange(a, b) {
        return a.edit.range[0] === b.edit.range[0] && a.edit.range[1] === b.edit.range[1];
    }
    isEmpty() {
        return this.edits.size === 0;
    }
    getDocumentVersion() {
        if (this.isEmpty()) {
            throw new Error('No edits recorded.');
        }
        return this.edits.values().next().value.documentVersion;
    }
    getScoped(diagnostics) {
        const result = [];
        for (const diagnostic of diagnostics) {
            const key = Diagnostics.computeKey(diagnostic);
            const editInfo = this.edits.get(key);
            if (editInfo) {
                result.push(editInfo);
            }
        }
        return result;
    }
    getAllSorted() {
        const result = [];
        for (const value of this.edits.values()) {
            if (Problem.isFixable(value)) {
                result.push(value);
            }
        }
        return result.sort((a, b) => {
            const d0 = a.edit.range[0] - b.edit.range[0];
            if (d0 !== 0) {
                return d0;
            }
            // Both edits have now the same start offset.
            // Length of a and length of b
            const al = a.edit.range[1] - a.edit.range[0];
            const bl = b.edit.range[1] - b.edit.range[0];
            // Both has the same start offset and length.
            if (al === bl) {
                return 0;
            }
            if (al === 0) {
                return -1;
            }
            if (bl === 0) {
                return 1;
            }
            return al - bl;
        });
    }
    getApplicable() {
        const sorted = this.getAllSorted();
        if (sorted.length <= 1) {
            return sorted;
        }
        const result = [];
        let last = sorted[0];
        result.push(last);
        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            if (!Fixes.overlaps(last, current) && !Fixes.sameRange(last, current)) {
                result.push(current);
                last = current;
            }
        }
        return result;
    }
}
exports.Fixes = Fixes;
/**
 * Manages the special save rule configurations done in the VS Code settings.
 */
var SaveRuleConfigs;
(function (SaveRuleConfigs) {
    const saveRuleConfigCache = new linkedMap_1.LRUCache(128);
    async function get(uri, settings) {
        const filePath = SaveRuleConfigs.inferFilePath(uri);
        let result = saveRuleConfigCache.get(uri);
        if (filePath === undefined || result === null) {
            return undefined;
        }
        if (result !== undefined) {
            return result;
        }
        const rules = settings.codeActionOnSave.rules;
        result = await ESLint.withClass(async (eslint) => {
            if (rules === undefined || eslint.isCLIEngine) {
                return undefined;
            }
            const config = await eslint.calculateConfigForFile(filePath);
            if (config === undefined || config.rules === undefined || config.rules.length === 0) {
                return undefined;
            }
            const offRules = new Set();
            const onRules = new Set();
            if (rules.length === 0) {
                Object.keys(config.rules).forEach(ruleId => offRules.add(ruleId));
            }
            else {
                for (const ruleId of Object.keys(config.rules)) {
                    if (isOff(ruleId, rules)) {
                        offRules.add(ruleId);
                    }
                    else {
                        onRules.add(ruleId);
                    }
                }
            }
            return offRules.size > 0 ? { offRules, onRules } : undefined;
        }, settings);
        if (result === undefined || result === null) {
            saveRuleConfigCache.set(uri, null);
            return undefined;
        }
        else {
            saveRuleConfigCache.set(uri, result);
            return result;
        }
    }
    SaveRuleConfigs.get = get;
    function remove(key) {
        return saveRuleConfigCache.delete(key);
    }
    SaveRuleConfigs.remove = remove;
    function clear() {
        saveRuleConfigCache.clear();
    }
    SaveRuleConfigs.clear = clear;
    function isOff(ruleId, matchers) {
        for (const matcher of matchers) {
            if (matcher.startsWith('!') && new RegExp(`^${matcher.slice(1).replace(/\*/g, '.*')}$`, 'g').test(ruleId)) {
                return true;
            }
            else if (new RegExp(`^${matcher.replace(/\*/g, '.*')}$`, 'g').test(ruleId)) {
                return false;
            }
        }
        return true;
    }
})(SaveRuleConfigs || (exports.SaveRuleConfigs = SaveRuleConfigs = {}));
/**
 * Manages rule severity overrides done using VS Code settings.
 */
var RuleSeverities;
(function (RuleSeverities) {
    const ruleSeverityCache = new linkedMap_1.LRUCache(1024);
    function getOverride(ruleId, customizations, isFixable) {
        let result = ruleSeverityCache.get(ruleId);
        if (result === null) {
            return undefined;
        }
        if (result !== undefined) {
            return result;
        }
        for (const customization of customizations) {
            if (
            // Rule name should match
            asteriskMatches(customization.rule, ruleId) &&
                // Fixable flag should match the fixability of the rule if it's defined
                (customization.fixable === undefined || customization.fixable === isFixable)) {
                result = customization.severity;
            }
        }
        if (result === undefined) {
            ruleSeverityCache.set(ruleId, null);
            return undefined;
        }
        ruleSeverityCache.set(ruleId, result);
        return result;
    }
    RuleSeverities.getOverride = getOverride;
    function clear() {
        ruleSeverityCache.clear();
    }
    RuleSeverities.clear = clear;
    function asteriskMatches(matcher, ruleId) {
        return matcher.startsWith('!')
            ? !(new RegExp(`^${matcher.slice(1).replace(/\*/g, '.*')}$`, 'g').test(ruleId))
            : new RegExp(`^${matcher.replace(/\*/g, '.*')}$`, 'g').test(ruleId);
    }
})(RuleSeverities || (exports.RuleSeverities = RuleSeverities = {}));
/**
 * Creates LSP Diagnostics and captures code action information.
 */
var Diagnostics;
(function (Diagnostics) {
    function computeKey(diagnostic) {
        const range = diagnostic.range;
        let message;
        if (diagnostic.message) {
            const hash = crypto.createHash('sha256');
            hash.update(diagnostic.message);
            message = hash.digest('base64');
        }
        return `[${range.start.line},${range.start.character},${range.end.line},${range.end.character}]-${diagnostic.code}-${message ?? ''}`;
    }
    Diagnostics.computeKey = computeKey;
    function create(settings, problem, document) {
        const message = problem.message;
        const startLine = typeof problem.line !== 'number' || Number.isNaN(problem.line) ? 0 : Math.max(0, problem.line - 1);
        const startChar = typeof problem.column !== 'number' || Number.isNaN(problem.column) ? 0 : Math.max(0, problem.column - 1);
        let endLine = typeof problem.endLine !== 'number' || Number.isNaN(problem.endLine) ? startLine : Math.max(0, problem.endLine - 1);
        let endChar = typeof problem.endColumn !== 'number' || Number.isNaN(problem.endColumn) ? startChar : Math.max(0, problem.endColumn - 1);
        if (settings.problems.shortenToSingleLine && endLine !== startLine) {
            const startLineText = document.getText({
                start: {
                    line: startLine,
                    character: 0,
                },
                end: {
                    line: startLine,
                    character: node_1.uinteger.MAX_VALUE,
                }
            });
            endLine = startLine;
            endChar = startLineText.length;
        }
        const override = RuleSeverities.getOverride(problem.ruleId, settings.rulesCustomizations, problem.fix !== undefined);
        const result = {
            message: message,
            severity: convertSeverityToDiagnosticWithOverride(problem.severity, override),
            source: 'eslint',
            range: {
                start: { line: startLine, character: startChar },
                end: { line: endLine, character: endChar }
            }
        };
        if (problem.ruleId) {
            const url = RuleMetaData.getUrl(problem.ruleId);
            result.code = problem.ruleId;
            if (url !== undefined) {
                result.codeDescription = {
                    href: url
                };
            }
            if (problem.ruleId === 'no-unused-vars') {
                result.tags = [node_1.DiagnosticTag.Unnecessary];
            }
        }
        return [result, override];
    }
    Diagnostics.create = create;
    function adjustSeverityForOverride(severity, severityOverride) {
        switch (severityOverride) {
            case settings_1.RuleSeverity.off:
            case settings_1.RuleSeverity.info:
            case settings_1.RuleSeverity.warn:
            case settings_1.RuleSeverity.error:
                return severityOverride;
            case settings_1.RuleSeverity.downgrade:
                switch (convertSeverityToDiagnostic(severity)) {
                    case node_1.DiagnosticSeverity.Error:
                        return settings_1.RuleSeverity.warn;
                    case node_1.DiagnosticSeverity.Warning:
                    case node_1.DiagnosticSeverity.Information:
                        return settings_1.RuleSeverity.info;
                }
            case settings_1.RuleSeverity.upgrade:
                switch (convertSeverityToDiagnostic(severity)) {
                    case node_1.DiagnosticSeverity.Information:
                        return settings_1.RuleSeverity.warn;
                    case node_1.DiagnosticSeverity.Warning:
                    case node_1.DiagnosticSeverity.Error:
                        return settings_1.RuleSeverity.error;
                }
            default:
                return severity;
        }
    }
    function convertSeverityToDiagnostic(severity) {
        // RuleSeverity concerns an overridden rule. A number is direct from ESLint.
        switch (severity) {
            // Eslint 1 is warning
            case 1:
            case settings_1.RuleSeverity.warn:
                return node_1.DiagnosticSeverity.Warning;
            case 2:
            case settings_1.RuleSeverity.error:
                return node_1.DiagnosticSeverity.Error;
            case settings_1.RuleSeverity.info:
                return node_1.DiagnosticSeverity.Information;
            default:
                return node_1.DiagnosticSeverity.Error;
        }
    }
    function convertSeverityToDiagnosticWithOverride(severity, severityOverride) {
        return convertSeverityToDiagnostic(adjustSeverityForOverride(severity, severityOverride));
    }
})(Diagnostics || (Diagnostics = {}));
/**
 * Capture information necessary to compute code actions.
 */
var CodeActions;
(function (CodeActions) {
    const codeActions = new Map();
    function get(uri) {
        return codeActions.get(uri);
    }
    CodeActions.get = get;
    function set(uri, value) {
        codeActions.set(uri, value);
    }
    CodeActions.set = set;
    function remove(uri) {
        return codeActions.delete(uri);
    }
    CodeActions.remove = remove;
    function record(document, diagnostic, problem) {
        if (!problem.ruleId) {
            return;
        }
        const uri = document.uri;
        let edits = CodeActions.get(uri);
        if (edits === undefined) {
            edits = new Map();
            CodeActions.set(uri, edits);
        }
        edits.set(Diagnostics.computeKey(diagnostic), {
            label: `Fix this ${problem.ruleId} problem`,
            documentVersion: document.version,
            ruleId: problem.ruleId,
            line: problem.line,
            diagnostic: diagnostic,
            edit: problem.fix,
            suggestions: problem.suggestions
        });
    }
    CodeActions.record = record;
})(CodeActions || (exports.CodeActions = CodeActions = {}));
/**
 * Wrapper round the ESLint npm module.
 */
var ESLint;
(function (ESLint) {
    let connection;
    let documents;
    let inferFilePath;
    let loadNodeModule;
    const languageId2ParserRegExp = function createLanguageId2ParserRegExp() {
        const result = new Map();
        const typescript = /\/@typescript-eslint\/parser\//;
        const babelESLint = /\/babel-eslint\/lib\/index.js$/;
        const vueESLint = /\/vue-eslint-parser\/index.js$/;
        result.set('typescript', [typescript, babelESLint, vueESLint]);
        result.set('typescriptreact', [typescript, babelESLint, vueESLint]);
        const angular = /\/@angular-eslint\/template-parser\//;
        result.set('html', [angular]);
        return result;
    }();
    const languageId2ParserOptions = function createLanguageId2ParserOptionsRegExp() {
        const result = new Map();
        const vue = /vue-eslint-parser\/.*\.js$/;
        const typescriptEslintParser = /@typescript-eslint\/parser\/.*\.js$/;
        result.set('typescript', { regExps: [vue], parsers: new Set(['@typescript-eslint/parser']), parserRegExps: [typescriptEslintParser] });
        return result;
    }();
    const languageId2PluginName = new Map([
        ['astro', 'astro'],
        ['html', 'html'],
        ['json', 'jsonc'],
        ['json5', 'jsonc'],
        ['jsonc', 'jsonc'],
        ['mdx', 'mdx'],
        ['vue', 'vue'],
        ['markdown', 'markdown']
    ]);
    const defaultLanguageIds = new Set([
        'javascript', 'javascriptreact'
    ]);
    const projectFolderIndicators = [
        { fileName: 'eslint.config.js', isRoot: true, isFlatConfig: true },
        { fileName: 'eslint.config.cjs', isRoot: true, isFlatConfig: true },
        { fileName: 'eslint.config.mjs', isRoot: true, isFlatConfig: true },
        { fileName: 'package.json', isRoot: true, isFlatConfig: false },
        { fileName: '.eslintignore', isRoot: true, isFlatConfig: false },
        { fileName: '.eslintrc', isRoot: false, isFlatConfig: false },
        { fileName: '.eslintrc.json', isRoot: false, isFlatConfig: false },
        { fileName: '.eslintrc.js', isRoot: false, isFlatConfig: false },
        { fileName: '.eslintrc.yaml', isRoot: false, isFlatConfig: false },
        { fileName: '.eslintrc.yml', isRoot: false, isFlatConfig: false }
    ];
    const path2Library = new Map();
    const document2Settings = new Map();
    const formatterRegistrations = new Map();
    function initialize($connection, $documents, $inferFilePath, $loadNodeModule) {
        connection = $connection;
        documents = $documents;
        inferFilePath = $inferFilePath;
        loadNodeModule = $loadNodeModule;
    }
    ESLint.initialize = initialize;
    function removeSettings(key) {
        return document2Settings.delete(key);
    }
    ESLint.removeSettings = removeSettings;
    function clearSettings() {
        document2Settings.clear();
    }
    ESLint.clearSettings = clearSettings;
    function unregisterAsFormatter(document) {
        const unregister = formatterRegistrations.get(document.uri);
        if (unregister !== undefined) {
            void unregister.then(disposable => disposable.dispose());
            formatterRegistrations.delete(document.uri);
        }
    }
    ESLint.unregisterAsFormatter = unregisterAsFormatter;
    function clearFormatters() {
        for (const unregistration of formatterRegistrations.values()) {
            void unregistration.then(disposable => disposable.dispose());
        }
        formatterRegistrations.clear();
    }
    ESLint.clearFormatters = clearFormatters;
    function resolveSettings(document) {
        const uri = document.uri;
        let resultPromise = document2Settings.get(uri);
        if (resultPromise) {
            return resultPromise;
        }
        resultPromise = connection.workspace.getConfiguration({ scopeUri: uri, section: '' }).then((configuration) => {
            const settings = Object.assign({}, configuration, { silent: false, library: undefined, resolvedGlobalPackageManagerPath: undefined }, { workingDirectory: undefined });
            if (settings.validate === settings_1.Validate.off) {
                return settings;
            }
            settings.resolvedGlobalPackageManagerPath = GlobalPaths.get(settings.packageManager);
            const filePath = inferFilePath(document);
            const workspaceFolderPath = settings.workspaceFolder !== undefined ? inferFilePath(settings.workspaceFolder.uri) : undefined;
            let assumeFlatConfig = false;
            const hasUserDefinedWorkingDirectories = configuration.workingDirectory !== undefined;
            const workingDirectoryConfig = configuration.workingDirectory ?? { mode: settings_1.ModeEnum.location };
            if (settings_1.ModeItem.is(workingDirectoryConfig)) {
                let candidate;
                if (workingDirectoryConfig.mode === settings_1.ModeEnum.location) {
                    if (workspaceFolderPath !== undefined) {
                        const [configLocation, isFlatConfig] = findWorkingDirectory(workspaceFolderPath, filePath);
                        if (isFlatConfig && settings.useFlatConfig !== false) {
                            candidate = configLocation;
                            assumeFlatConfig = true;
                        }
                        else {
                            candidate = workspaceFolderPath;
                        }
                    }
                    else if (filePath !== undefined && !(0, paths_1.isUNC)(filePath)) {
                        candidate = path.dirname(filePath);
                    }
                }
                else if (workingDirectoryConfig.mode === settings_1.ModeEnum.auto) {
                    if (workspaceFolderPath !== undefined) {
                        candidate = findWorkingDirectory(workspaceFolderPath, filePath)[0];
                    }
                    else if (filePath !== undefined && !(0, paths_1.isUNC)(filePath)) {
                        candidate = path.dirname(filePath);
                    }
                }
                if (candidate !== undefined && fs.existsSync(candidate)) {
                    settings.workingDirectory = { directory: candidate };
                }
            }
            else {
                settings.workingDirectory = workingDirectoryConfig;
            }
            let nodePath;
            if (settings.nodePath !== null) {
                nodePath = settings.nodePath;
                if (!path.isAbsolute(nodePath) && workspaceFolderPath !== undefined) {
                    nodePath = path.join(workspaceFolderPath, nodePath);
                }
            }
            let moduleResolveWorkingDirectory;
            if (!hasUserDefinedWorkingDirectories && filePath !== undefined) {
                moduleResolveWorkingDirectory = path.dirname(filePath);
            }
            if (moduleResolveWorkingDirectory === undefined && settings.workingDirectory !== undefined && !settings.workingDirectory['!cwd']) {
                moduleResolveWorkingDirectory = settings.workingDirectory.directory;
            }
            let promise;
            // During Flat Config is considered experimental,
            // we need to import FlatESLint from 'eslint/use-at-your-own-risk'.
            // See: https://eslint.org/blog/2022/08/new-config-system-part-3/
            const eslintPath = settings.experimental?.useFlatConfig ? 'eslint/use-at-your-own-risk' : 'eslint';
            if (nodePath !== undefined) {
                promise = node_1.Files.resolve(eslintPath, nodePath, nodePath, trace).then(undefined, () => {
                    return node_1.Files.resolve(eslintPath, settings.resolvedGlobalPackageManagerPath, moduleResolveWorkingDirectory, trace);
                });
            }
            else {
                promise = node_1.Files.resolve(eslintPath, settings.resolvedGlobalPackageManagerPath, moduleResolveWorkingDirectory, trace);
            }
            settings.silent = settings.validate === settings_1.Validate.probe;
            return promise.then(async (libraryPath) => {
                let library = path2Library.get(libraryPath);
                if (library === undefined) {
                    if (settings.experimental?.useFlatConfig === true) {
                        const lib = loadNodeModule(libraryPath);
                        if (lib === undefined) {
                            settings.validate = settings_1.Validate.off;
                            if (!settings.silent) {
                                connection.console.error(`Failed to load eslint library from ${libraryPath}. If you are using ESLint v8.21 or earlier, try upgrading it. For newer versions, try disabling the 'eslint.experimental.useFlatConfig' setting. See the output panel for more information.`);
                            }
                        }
                        else if (lib.FlatESLint === undefined) {
                            settings.validate = settings_1.Validate.off;
                            connection.console.error(`The eslint library loaded from ${libraryPath} doesn\'t export a FlatESLint class.`);
                        }
                        else {
                            connection.console.info(`ESLint library loaded from: ${libraryPath}`);
                            // pretend to be a regular eslint endpoint
                            library = {
                                ESLint: lib.FlatESLint,
                                isFlatConfig: true,
                                CLIEngine: undefined,
                            };
                            settings.library = library;
                            path2Library.set(libraryPath, library);
                        }
                    }
                    else {
                        library = loadNodeModule(libraryPath);
                        if (library === undefined) {
                            settings.validate = settings_1.Validate.off;
                            if (!settings.silent) {
                                connection.console.error(`Failed to load eslint library from ${libraryPath}. See output panel for more information.`);
                            }
                        }
                        else if (library.CLIEngine === undefined && library.ESLint === undefined) {
                            settings.validate = settings_1.Validate.off;
                            connection.console.error(`The eslint library loaded from ${libraryPath} doesn\'t export neither a CLIEngine nor an ESLint class. You need at least eslint@1.0.0`);
                        }
                        else {
                            connection.console.info(`ESLint library loaded from: ${libraryPath}`);
                            settings.library = library;
                            path2Library.set(libraryPath, library);
                        }
                    }
                    if (library !== undefined && ESLintModule.hasESLintClass(library) && typeof library.ESLint.version === 'string') {
                        const esLintVersion = semverParse(library.ESLint.version);
                        if (esLintVersion !== null) {
                            if (semverGte(esLintVersion, '8.57.0') && settings.experimental?.useFlatConfig === true) {
                                connection.console.info(`ESLint version ${library.ESLint.version} supports flat config without experimental opt-in. The 'eslint.experimental.useFlatConfig' setting can be removed.`);
                            }
                            else if (semverGte(esLintVersion, '10.0.0') && (settings.experimental?.useFlatConfig === false || settings.useFlatConfig === false)) {
                                connection.console.info(`ESLint version ${library.ESLint.version} only supports flat configs. Setting is ignored.`);
                            }
                        }
                    }
                }
                else {
                    settings.library = library;
                }
                if (settings.validate === settings_1.Validate.probe && TextDocumentSettings.hasLibrary(settings)) {
                    settings.validate = settings_1.Validate.off;
                    const filePath = ESLint.getFilePath(document, settings);
                    if (filePath !== undefined) {
                        const parserRegExps = languageId2ParserRegExp.get(document.languageId);
                        const pluginName = languageId2PluginName.get(document.languageId);
                        const parserOptions = languageId2ParserOptions.get(document.languageId);
                        if (defaultLanguageIds.has(document.languageId)) {
                            try {
                                const [isIgnored, configType] = await ESLint.withClass(async (eslintClass) => {
                                    return [await eslintClass.isPathIgnored(filePath), ESLintClass.getConfigType(eslintClass)];
                                }, settings);
                                if (isIgnored === false || (isIgnored === true && settings.onIgnoredFiles !== settings_1.ESLintSeverity.off)) {
                                    settings.validate = settings_1.Validate.on;
                                    if (assumeFlatConfig && configType === 'eslintrc') {
                                        connection.console.info(`Expected to use flat configuration from directory ${settings.workingDirectory?.directory} but loaded eslintrc config.`);
                                    }
                                }
                            }
                            catch (error) {
                                settings.validate = settings_1.Validate.off;
                                await connection.sendNotification(customMessages_1.StatusNotification.type, { uri, state: customMessages_1.Status.error });
                                connection.console.error(`Calculating config file for ${uri}) failed.\n${error instanceof Error ? error.stack : ''}`);
                            }
                        }
                        else if (parserRegExps !== undefined || pluginName !== undefined || parserOptions !== undefined) {
                            const [eslintConfig, configType] = await ESLint.withClass(async (eslintClass) => {
                                try {
                                    if (await eslintClass.isPathIgnored(filePath)) {
                                        return [undefined, undefined];
                                    }
                                    else {
                                        return [await eslintClass.calculateConfigForFile(filePath), ESLintClass.getConfigType(eslintClass)];
                                    }
                                }
                                catch (err) {
                                    try {
                                        await connection.sendNotification(customMessages_1.StatusNotification.type, { uri, state: customMessages_1.Status.error });
                                        connection.console.error(`Calculating config file for ${uri}) failed.\n${err instanceof Error ? err.stack : ''}`);
                                    }
                                    catch {
                                        // little we can do here
                                    }
                                    return [undefined, undefined];
                                }
                            }, settings);
                            if (eslintConfig !== undefined) {
                                if (assumeFlatConfig && configType === 'eslintrc') {
                                    connection.console.info(`Expected to use flat configuration from directory ${settings.workingDirectory?.directory} but loaded eslintrc config.`);
                                }
                                if (configType === 'flat' || ESLintModule.isFlatConfig(settings.library)) {
                                    // We have a flat configuration. This means that the config file needs to
                                    // have a section per file extension we want to validate. If there is none than
                                    // `calculateConfigForFile` will return no config since the config options without
                                    // a `files` property only applies to `**/*.js, **/*.cjs, and **/*.mjs` by default
                                    // See https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new#specifying-files-and-ignores
                                    // This means since we have found a configuration for the given file we assume that
                                    // that configuration is correctly pointing to a parser.
                                    settings.validate = settings_1.Validate.on;
                                }
                                else {
                                    const parser = eslintConfig.parser !== null
                                        ? (0, paths_1.normalizePath)(eslintConfig.parser)
                                        : undefined;
                                    if (parser !== undefined) {
                                        if (parserRegExps !== undefined) {
                                            for (const regExp of parserRegExps) {
                                                if (regExp.test(parser)) {
                                                    settings.validate = settings_1.Validate.on;
                                                    break;
                                                }
                                            }
                                        }
                                        if (settings.validate !== settings_1.Validate.on && parserOptions !== undefined && typeof eslintConfig.parserOptions?.parser === 'string') {
                                            const eslintConfigParserOptionsParser = (0, paths_1.normalizePath)(eslintConfig.parserOptions.parser);
                                            for (const regExp of parserOptions.regExps) {
                                                if (regExp.test(parser) && (parserOptions.parsers.has(eslintConfig.parserOptions.parser) ||
                                                    parserOptions.parserRegExps !== undefined && parserOptions.parserRegExps.some(parserRegExp => parserRegExp.test(eslintConfigParserOptionsParser)))) {
                                                    settings.validate = settings_1.Validate.on;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if (settings.validate !== settings_1.Validate.on && Array.isArray(eslintConfig.plugins) && eslintConfig.plugins.length > 0 && pluginName !== undefined) {
                                        for (const name of eslintConfig.plugins) {
                                            if (name === pluginName) {
                                                settings.validate = settings_1.Validate.on;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (settings.validate === settings_1.Validate.off) {
                        const params = { textDocument: { uri: document.uri } };
                        void connection.sendRequest(customMessages_1.ProbeFailedRequest.type, params);
                    }
                }
                if (settings.validate === settings_1.Validate.on) {
                    settings.silent = false;
                    if (settings.format && TextDocumentSettings.hasLibrary(settings) && !formatterRegistrations.has(uri)) {
                        const Uri = vscode_uri_1.URI.parse(uri);
                        const isFile = Uri.scheme === 'file';
                        let pattern = isFile
                            ? Uri.fsPath.replace(/\\/g, '/')
                            : Uri.fsPath;
                        pattern = pattern.replace(/[\[\]\{\}]/g, '?');
                        const filter = { scheme: Uri.scheme, pattern: pattern };
                        const options = { documentSelector: [filter] };
                        if (!isFile) {
                            formatterRegistrations.set(uri, connection.client.register(node_1.DocumentFormattingRequest.type, options));
                        }
                        else {
                            const filePath = inferFilePath(uri);
                            await ESLint.withClass(async (eslintClass) => {
                                if (!await eslintClass.isPathIgnored(filePath)) {
                                    formatterRegistrations.set(uri, connection.client.register(node_1.DocumentFormattingRequest.type, options));
                                }
                            }, settings);
                        }
                    }
                }
                return settings;
            }, () => {
                settings.validate = settings_1.Validate.off;
                if (!settings.silent) {
                    void connection.sendRequest(customMessages_1.NoESLintLibraryRequest.type, { source: { uri: document.uri } });
                }
                return settings;
            });
        });
        document2Settings.set(uri, resultPromise);
        return resultPromise;
    }
    ESLint.resolveSettings = resolveSettings;
    async function newClass(library, newOptions, settings) {
        // Since ESLint version 8.57 we have a dedicated loadESLint function
        // which takes care of loading the right ESLint class. We available
        // we use it.
        if (ESLintModule.hasLoadESLint(library)) {
            return new (await library.loadESLint({ useFlatConfig: settings.useFlatConfig }))(newOptions);
        }
        // If we have version 7 where we have both ESLint class and CLIEngine we only
        // use the ESLint class if a corresponding setting (useESLintClass) is set.
        if (ESLintModule.hasESLintClass(library) && settings.useESLintClass) {
            return new library.ESLint(newOptions);
        }
        if (ESLintModule.hasCLIEngine(library)) {
            return new ESLintClassEmulator(new library.CLIEngine(newOptions));
        }
        return new library.ESLint(newOptions);
    }
    ESLint.newClass = newClass;
    async function withClass(func, settings, options) {
        const newOptions = options === undefined
            ? Object.assign(Object.create(null), settings.options)
            : Object.assign(Object.create(null), settings.options, options);
        const cwd = process.cwd();
        try {
            if (settings.workingDirectory) {
                // A lot of libs are sensitive to drive letter casing and assume a
                // upper case drive letter. Make sure we support that correctly.
                const newCWD = normalizeWorkingDirectory(settings.workingDirectory.directory);
                newOptions.cwd = newCWD;
                if (settings.workingDirectory['!cwd'] !== true && fs.existsSync(newCWD)) {
                    process.chdir(newCWD);
                }
            }
            const eslintClass = await newClass(settings.library, newOptions, settings);
            // We need to await the result to ensure proper execution of the
            // finally block.
            return await func(eslintClass);
        }
        finally {
            if (cwd !== process.cwd()) {
                process.chdir(cwd);
            }
        }
    }
    ESLint.withClass = withClass;
    function normalizeWorkingDirectory(value) {
        const result = (0, paths_1.normalizeDriveLetter)(value);
        if (result.length === 0) {
            return result;
        }
        return result[result.length - 1] === path.sep
            ? result.substring(0, result.length - 1)
            : result;
    }
    function getFilePath(document, settings) {
        if (document === undefined) {
            return undefined;
        }
        const uri = vscode_uri_1.URI.parse(document.uri);
        if (uri.scheme !== 'file') {
            if (settings.workspaceFolder !== undefined) {
                const ext = languageDefaults_1.default.getExtension(document.languageId);
                const workspacePath = inferFilePath(settings.workspaceFolder.uri);
                if (workspacePath !== undefined && ext !== undefined) {
                    return path.join(workspacePath, `test.${ext}`);
                }
            }
            return undefined;
        }
        else {
            return inferFilePath(uri);
        }
    }
    ESLint.getFilePath = getFilePath;
    const validFixTypes = new Set(['problem', 'suggestion', 'layout', 'directive']);
    async function validate(document, settings) {
        const newOptions = Object.assign(Object.create(null), settings.options);
        let fixTypes = undefined;
        if (Array.isArray(newOptions.fixTypes) && newOptions.fixTypes.length > 0) {
            fixTypes = new Set();
            for (const item of newOptions.fixTypes) {
                if (validFixTypes.has(item)) {
                    fixTypes.add(item);
                }
            }
            if (fixTypes.size === 0) {
                fixTypes = undefined;
            }
        }
        const content = document.getText();
        const uri = document.uri;
        const file = getFilePath(document, settings);
        return withClass(async (eslintClass) => {
            CodeActions.remove(uri);
            const reportResults = await eslintClass.lintText(content, { filePath: file, warnIgnored: settings.onIgnoredFiles !== settings_1.ESLintSeverity.off });
            RuleMetaData.capture(eslintClass, reportResults);
            const diagnostics = [];
            if (reportResults && Array.isArray(reportResults) && reportResults.length > 0) {
                const docReport = reportResults[0];
                if (docReport.messages && Array.isArray(docReport.messages)) {
                    docReport.messages.forEach((problem) => {
                        if (problem) {
                            const [diagnostic, override] = Diagnostics.create(settings, problem, document);
                            if (!(override === settings_1.RuleSeverity.off || (settings.quiet && diagnostic.severity === node_1.DiagnosticSeverity.Warning))) {
                                diagnostics.push(diagnostic);
                            }
                            if (fixTypes !== undefined && problem.ruleId !== undefined && problem.fix !== undefined) {
                                const type = RuleMetaData.getType(problem.ruleId);
                                if (type !== undefined && fixTypes.has(type)) {
                                    CodeActions.record(document, diagnostic, problem);
                                }
                            }
                            else {
                                if (RuleMetaData.isUnusedDisableDirectiveProblem(problem)) {
                                    problem.ruleId = RuleMetaData.unusedDisableDirectiveId;
                                }
                                CodeActions.record(document, diagnostic, problem);
                            }
                        }
                    });
                }
            }
            return diagnostics;
        }, settings);
    }
    ESLint.validate = validate;
    function trace(message, verbose) {
        connection.tracer.log(message, verbose);
    }
    /**
     * Global paths for the different package managers
     */
    let GlobalPaths;
    (function (GlobalPaths) {
        const globalPaths = {
            yarn: {
                cache: undefined,
                get() {
                    return node_1.Files.resolveGlobalYarnPath(trace);
                }
            },
            npm: {
                cache: undefined,
                get() {
                    return node_1.Files.resolveGlobalNodePath(trace);
                }
            },
            pnpm: {
                cache: undefined,
                get() {
                    const pnpmPath = (0, child_process_1.execSync)('pnpm root -g').toString().trim();
                    return pnpmPath;
                }
            }
        };
        function get(packageManager) {
            const pm = globalPaths[packageManager];
            if (pm) {
                if (pm.cache === undefined) {
                    pm.cache = pm.get();
                }
                return pm.cache;
            }
            return undefined;
        }
        GlobalPaths.get = get;
    })(GlobalPaths || (GlobalPaths = {}));
    function findWorkingDirectory(workspaceFolder, file) {
        if (file === undefined || (0, paths_1.isUNC)(file)) {
            return [workspaceFolder, false];
        }
        // Don't probe for something in node modules folder.
        if (file.indexOf(`${path.sep}node_modules${path.sep}`) !== -1) {
            return [workspaceFolder, false];
        }
        let result = workspaceFolder;
        let flatConfig = false;
        let directory = path.dirname(file);
        outer: while (directory !== undefined && directory.startsWith(workspaceFolder)) {
            for (const { fileName, isRoot, isFlatConfig } of projectFolderIndicators) {
                if (fs.existsSync(path.join(directory, fileName))) {
                    result = directory;
                    flatConfig = isFlatConfig;
                    if (isRoot) {
                        break outer;
                    }
                    else {
                        break;
                    }
                }
            }
            const parent = path.dirname(directory);
            directory = parent !== directory ? parent : undefined;
        }
        return [result, flatConfig];
    }
    ESLint.findWorkingDirectory = findWorkingDirectory;
    let ErrorHandlers;
    (function (ErrorHandlers) {
        ErrorHandlers.single = [
            tryHandleNoConfig,
            tryHandleConfigError,
            tryHandleMissingModule,
            showErrorMessage
        ];
        function getMessage(err, document) {
            let result = undefined;
            if (typeof err.message === 'string' || err.message instanceof String) {
                result = err.message;
                result = result.replace(/\r?\n/g, ' ');
                if (/^CLI: /.test(result)) {
                    result = result.substr(5);
                }
            }
            else {
                result = `An unknown error occurred while validating document: ${document.uri}`;
            }
            return result;
        }
        ErrorHandlers.getMessage = getMessage;
        const noConfigReported = new Map();
        function clearNoConfigReported() {
            noConfigReported.clear();
        }
        ErrorHandlers.clearNoConfigReported = clearNoConfigReported;
        function tryHandleNoConfig(error, document, library) {
            if (!ESLintError.isNoConfigFound(error)) {
                return undefined;
            }
            if (!noConfigReported.has(document.uri)) {
                connection.sendRequest(customMessages_1.NoConfigRequest.type, {
                    message: getMessage(error, document),
                    document: {
                        uri: document.uri
                    }
                }).then(undefined, () => { });
                noConfigReported.set(document.uri, library);
            }
            return customMessages_1.Status.warn;
        }
        const configErrorReported = new Map();
        function getConfigErrorReported(key) {
            return configErrorReported.get(key);
        }
        ErrorHandlers.getConfigErrorReported = getConfigErrorReported;
        function removeConfigErrorReported(key) {
            return configErrorReported.delete(key);
        }
        ErrorHandlers.removeConfigErrorReported = removeConfigErrorReported;
        function tryHandleConfigError(error, document, library, settings) {
            if (!error.message) {
                return undefined;
            }
            function handleFileName(filename) {
                if (!configErrorReported.has(filename)) {
                    connection.console.error(getMessage(error, document));
                    if (!documents.get(vscode_uri_1.URI.file(filename).toString())) {
                        connection.window.showInformationMessage(getMessage(error, document));
                    }
                    configErrorReported.set(filename, { library, settings });
                }
                return customMessages_1.Status.warn;
            }
            let matches = /Cannot read config file:\s+(.*)\nError:\s+(.*)/.exec(error.message);
            if (matches && matches.length === 3) {
                return handleFileName(matches[1]);
            }
            matches = /(.*):\n\s*Configuration for rule \"(.*)\" is /.exec(error.message);
            if (matches && matches.length === 3) {
                return handleFileName(matches[1]);
            }
            matches = /Cannot find module '([^']*)'\nReferenced from:\s+(.*)/.exec(error.message);
            if (matches && matches.length === 3) {
                return handleFileName(matches[2]);
            }
            return undefined;
        }
        const missingModuleReported = new Map();
        function clearMissingModuleReported() {
            missingModuleReported.clear();
        }
        ErrorHandlers.clearMissingModuleReported = clearMissingModuleReported;
        function tryHandleMissingModule(error, document, library) {
            if (!error.message) {
                return undefined;
            }
            function handleMissingModule(plugin, module, error) {
                if (!missingModuleReported.has(plugin)) {
                    const fsPath = inferFilePath(document);
                    missingModuleReported.set(plugin, library);
                    if (error.messageTemplate === 'plugin-missing') {
                        connection.console.error([
                            '',
                            `${error.message.toString()}`,
                            `Happened while validating ${fsPath ? fsPath : document.uri}`,
                            `This can happen for a couple of reasons:`,
                            `1. The plugin name is spelled incorrectly in an ESLint configuration file (e.g. .eslintrc).`,
                            `2. If ESLint is installed globally, then make sure ${module} is installed globally as well.`,
                            `3. If ESLint is installed locally, then ${module} isn't installed correctly.`,
                            '',
                            `Consider running eslint --debug ${fsPath ? fsPath : document.uri} from a terminal to obtain a trace about the configuration files used.`
                        ].join('\n'));
                    }
                    else {
                        connection.console.error([
                            `${error.message.toString()}`,
                            `Happened while validating ${fsPath ? fsPath : document.uri}`
                        ].join('\n'));
                    }
                }
                return customMessages_1.Status.warn;
            }
            const matches = /Failed to load plugin (.*): Cannot find module (.*)/.exec(error.message);
            if (matches && matches.length === 3) {
                return handleMissingModule(matches[1], matches[2], error);
            }
            return undefined;
        }
        function showErrorMessage(error, document) {
            if (Is.string(error.stack)) {
                connection.console.error('An unexpected error occurred:');
                connection.console.error(error.stack);
            }
            else {
                connection.console.error(`An unexpected error occurred: ${getMessage(error, document)}.`);
            }
            return customMessages_1.Status.error;
        }
    })(ErrorHandlers = ESLint.ErrorHandlers || (ESLint.ErrorHandlers = {}));
})(ESLint || (exports.ESLint = ESLint = {}));
//# sourceMappingURL=eslint.js.map