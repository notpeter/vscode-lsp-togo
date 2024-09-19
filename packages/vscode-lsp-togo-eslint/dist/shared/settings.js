"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectoryItem = exports.ModeItem = exports.ModeEnum = exports.RuleSeverity = exports.ESLintSeverity = exports.CodeActionsOnSaveRules = exports.CodeActionsOnSaveMode = exports.Validate = void 0;
var Is;
(function (Is) {
    const toString = Object.prototype.toString;
    function boolean(value) {
        return value === true || value === false;
    }
    Is.boolean = boolean;
    function string(value) {
        return toString.call(value) === '[object String]';
    }
    Is.string = string;
})(Is || (Is = {}));
var Validate;
(function (Validate) {
    Validate["on"] = "on";
    Validate["off"] = "off";
    Validate["probe"] = "probe";
})(Validate || (exports.Validate = Validate = {}));
var CodeActionsOnSaveMode;
(function (CodeActionsOnSaveMode) {
    CodeActionsOnSaveMode["all"] = "all";
    CodeActionsOnSaveMode["problems"] = "problems";
})(CodeActionsOnSaveMode || (exports.CodeActionsOnSaveMode = CodeActionsOnSaveMode = {}));
(function (CodeActionsOnSaveMode) {
    function from(value) {
        if (value === undefined || value === null || !Is.string(value)) {
            return CodeActionsOnSaveMode.all;
        }
        switch (value.toLowerCase()) {
            case CodeActionsOnSaveMode.problems:
                return CodeActionsOnSaveMode.problems;
            default:
                return CodeActionsOnSaveMode.all;
        }
    }
    CodeActionsOnSaveMode.from = from;
})(CodeActionsOnSaveMode || (exports.CodeActionsOnSaveMode = CodeActionsOnSaveMode = {}));
var CodeActionsOnSaveRules;
(function (CodeActionsOnSaveRules) {
    function from(value) {
        if (value === undefined || value === null || !Array.isArray(value)) {
            return undefined;
        }
        return value.filter(item => Is.string(item));
    }
    CodeActionsOnSaveRules.from = from;
})(CodeActionsOnSaveRules || (exports.CodeActionsOnSaveRules = CodeActionsOnSaveRules = {}));
var ESLintSeverity;
(function (ESLintSeverity) {
    ESLintSeverity["off"] = "off";
    ESLintSeverity["warn"] = "warn";
    ESLintSeverity["error"] = "error";
})(ESLintSeverity || (exports.ESLintSeverity = ESLintSeverity = {}));
(function (ESLintSeverity) {
    function from(value) {
        if (value === undefined || value === null) {
            return ESLintSeverity.off;
        }
        switch (value.toLowerCase()) {
            case ESLintSeverity.off:
                return ESLintSeverity.off;
            case ESLintSeverity.warn:
                return ESLintSeverity.warn;
            case ESLintSeverity.error:
                return ESLintSeverity.error;
            default:
                return ESLintSeverity.off;
        }
    }
    ESLintSeverity.from = from;
})(ESLintSeverity || (exports.ESLintSeverity = ESLintSeverity = {}));
var RuleSeverity;
(function (RuleSeverity) {
    // Original ESLint values
    RuleSeverity["info"] = "info";
    RuleSeverity["warn"] = "warn";
    RuleSeverity["error"] = "error";
    RuleSeverity["off"] = "off";
    // Added severity override changes
    RuleSeverity["default"] = "default";
    RuleSeverity["downgrade"] = "downgrade";
    RuleSeverity["upgrade"] = "upgrade";
})(RuleSeverity || (exports.RuleSeverity = RuleSeverity = {}));
var ModeEnum;
(function (ModeEnum) {
    ModeEnum["auto"] = "auto";
    ModeEnum["location"] = "location";
})(ModeEnum || (exports.ModeEnum = ModeEnum = {}));
(function (ModeEnum) {
    function is(value) {
        return value === ModeEnum.auto || value === ModeEnum.location;
    }
    ModeEnum.is = is;
})(ModeEnum || (exports.ModeEnum = ModeEnum = {}));
var ModeItem;
(function (ModeItem) {
    function is(item) {
        const candidate = item;
        return candidate && ModeEnum.is(candidate.mode);
    }
    ModeItem.is = is;
})(ModeItem || (exports.ModeItem = ModeItem = {}));
var DirectoryItem;
(function (DirectoryItem) {
    function is(item) {
        const candidate = item;
        return candidate && Is.string(candidate.directory) && (Is.boolean(candidate['!cwd']) || candidate['!cwd'] === undefined);
    }
    DirectoryItem.is = is;
})(DirectoryItem || (exports.DirectoryItem = DirectoryItem = {}));
//# sourceMappingURL=settings.js.map