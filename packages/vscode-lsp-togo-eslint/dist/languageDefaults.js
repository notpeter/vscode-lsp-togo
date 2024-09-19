"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const languageId2Config = new Map([
    ['javascript', { ext: 'js', lineComment: '//', blockComment: ['/*', '*/'] }],
    ['javascriptreact', { ext: 'jsx', lineComment: '//', blockComment: ['/*', '*/'] }],
    ['typescript', { ext: 'ts', lineComment: '//', blockComment: ['/*', '*/'] }],
    ['typescriptreact', { ext: 'tsx', lineComment: '//', blockComment: ['/*', '*/'] }],
    ['html', { ext: 'html', lineComment: '//', blockComment: ['<!--', '-->'] }],
    ['vue', { ext: 'vue', lineComment: '//', blockComment: ['<!--', '-->'] }],
    ['coffeescript', { ext: 'coffee', lineComment: '#', blockComment: ['###', '###'] }],
    ['yaml', { ext: 'yaml', lineComment: '#', blockComment: ['#', ''] }],
    ['graphql', { ext: 'graphql', lineComment: '#', blockComment: ['#', ''] }]
]);
var LanguageDefaults;
(function (LanguageDefaults) {
    function getLineComment(languageId) {
        return languageId2Config.get(languageId)?.lineComment ?? '//';
    }
    LanguageDefaults.getLineComment = getLineComment;
    function getBlockComment(languageId) {
        return languageId2Config.get(languageId)?.blockComment ?? ['/**', '*/'];
    }
    LanguageDefaults.getBlockComment = getBlockComment;
    function getExtension(languageId) {
        return languageId2Config.get(languageId)?.ext;
    }
    LanguageDefaults.getExtension = getExtension;
})(LanguageDefaults || (LanguageDefaults = {}));
exports.default = LanguageDefaults;
//# sourceMappingURL=languageDefaults.js.map