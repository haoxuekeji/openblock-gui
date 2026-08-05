/**
 * Lightweight Monaco completion items for MicroPython / Arduino C++.
 * Registered against Monaco 0.20 without upgrading the editor package.
 */

const PYTHON_KEYWORDS = [
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
    'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
    'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
    'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
];

/* eslint-disable no-template-curly-in-string */
const MICROPYTHON_SNIPPETS = [
    {label: 'from machine import Pin', insertText: 'from machine import Pin'},
    {label: 'from machine import ADC', insertText: 'from machine import ADC'},
    {label: 'from machine import PWM', insertText: 'from machine import PWM'},
    {label: 'from machine import SoftI2C', insertText: 'from machine import SoftI2C'},
    {label: 'from machine import SoftSPI', insertText: 'from machine import SoftSPI'},
    {label: 'from machine import Timer', insertText: 'from machine import Timer'},
    {label: 'from machine import reset', insertText: 'from machine import reset'},
    {label: 'import time', insertText: 'import time'},
    {label: 'import utime', insertText: 'import utime'},
    {label: 'import network', insertText: 'import network'},
    {label: 'import ubinascii', insertText: 'import ubinascii'},
    {label: 'import ujson', insertText: 'import ujson'},
    {label: 'import urequests', insertText: 'import urequests'},
    {label: 'Pin.IN', insertText: 'Pin.IN'},
    {label: 'Pin.OUT', insertText: 'Pin.OUT'},
    {label: 'Pin.PULL_UP', insertText: 'Pin.PULL_UP'},
    {label: 'Pin.PULL_DOWN', insertText: 'Pin.PULL_DOWN'},
    {label: 'time.sleep', insertText: 'time.sleep(${1:1})'},
    {label: 'time.sleep_ms', insertText: 'time.sleep_ms(${1:100})'},
    {label: 'print', insertText: 'print(${1})'}
];

const CPP_KEYWORDS = [
    'auto', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default',
    'delete', 'do', 'else', 'enum', 'false', 'for', 'if', 'inline', 'namespace',
    'new', 'private', 'protected', 'public', 'return', 'sizeof', 'static',
    'struct', 'switch', 'template', 'this', 'true', 'try', 'typedef', 'typename',
    'using', 'virtual', 'void', 'while'
];

const ARDUINO_SNIPPETS = [
    {label: 'setup', insertText: 'void setup() {\n\t${1}\n}'},
    {label: 'loop', insertText: 'void loop() {\n\t${1}\n}'},
    {label: 'pinMode', insertText: 'pinMode(${1:pin}, ${2:OUTPUT});'},
    {label: 'digitalWrite', insertText: 'digitalWrite(${1:pin}, ${2:HIGH});'},
    {label: 'digitalRead', insertText: 'digitalRead(${1:pin})'},
    {label: 'analogRead', insertText: 'analogRead(${1:pin})'},
    {label: 'analogWrite', insertText: 'analogWrite(${1:pin}, ${2:value});'},
    {label: 'delay', insertText: 'delay(${1:1000});'},
    {label: 'Serial.begin', insertText: 'Serial.begin(${1:9600});'},
    {label: 'Serial.println', insertText: 'Serial.println(${1});'},
    {label: 'HIGH', insertText: 'HIGH'},
    {label: 'LOW', insertText: 'LOW'},
    {label: 'INPUT', insertText: 'INPUT'},
    {label: 'OUTPUT', insertText: 'OUTPUT'},
    {label: 'INPUT_PULLUP', insertText: 'INPUT_PULLUP'}
];
/* eslint-enable no-template-curly-in-string */

let registered = false;

/**
 * Register completion providers once for the Monaco instance.
 * Safe to call from every editorWillMount.
 * @param {object} monaco - monaco API.
 */
const registerCodeEditorCompletions = monaco => {
    if (!monaco || !monaco.languages || registered) {
        return;
    }
    registered = true;

    const Kind = monaco.languages.CompletionItemKind;

    const wordRange = (model, position) => {
        const word = model.getWordUntilPosition(position);
        return {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
        };
    };

    const toItems = (list, kind, range, isSnippet) => list.map(item => {
        if (typeof item === 'string') {
            return {
                label: item,
                kind,
                insertText: item,
                range
            };
        }
        const suggestion = {
            label: item.label,
            kind: isSnippet ? Kind.Snippet : kind,
            insertText: item.insertText,
            range
        };
        if (isSnippet) {
            suggestion.insertTextRules =
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
        }
        return suggestion;
    });

    monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.', '_'],
        provideCompletionItems (model, position) {
            const range = wordRange(model, position);
            return {
                suggestions: toItems(PYTHON_KEYWORDS, Kind.Keyword, range, false)
                    .concat(toItems(MICROPYTHON_SNIPPETS, Kind.Function, range, true))
            };
        }
    });

    // Arduino sketches use the cpp language id in this project.
    monaco.languages.registerCompletionItemProvider('cpp', {
        triggerCharacters: ['.', '_'],
        provideCompletionItems (model, position) {
            const range = wordRange(model, position);
            return {
                suggestions: toItems(CPP_KEYWORDS, Kind.Keyword, range, false)
                    .concat(toItems(ARDUINO_SNIPPETS, Kind.Function, range, true))
            };
        }
    });
};

export {
    registerCodeEditorCompletions,
    PYTHON_KEYWORDS,
    MICROPYTHON_SNIPPETS,
    CPP_KEYWORDS,
    ARDUINO_SNIPPETS
};
