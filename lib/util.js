#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDefaultBrowserAndPage = getDefaultBrowserAndPage;
exports.getDefaultBrowser = getDefaultBrowser;
exports.getDefaultPage = getDefaultPage;
exports.newPage = newPage;
exports.runScript = runScript;
exports.onConsole = onConsole;
exports.readStdin = readStdin;
exports.isRecoverableError = isRecoverableError;
exports.debug = debug;
exports.isRecoverableErrorRe = void 0;

var _puppeteer = _interopRequireDefault(require("puppeteer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function getDefaultBrowserAndPage() {
  const [browser, page] = await Promise.all([getDefaultBrowser(), getDefaultPage()]);
  return {
    browser,
    page
  };
}

let defaultBrowser;

async function getDefaultBrowser() {
  if (!(await defaultBrowser)) {
    // this block must not be async
    defaultBrowser = _puppeteer.default.launch();
  }

  return defaultBrowser;
}

let defaultPage;

async function getDefaultPage() {
  if (!(await defaultPage)) {
    // this block must not be async
    defaultPage = getDefaultBrowser().then(newPage);
  }

  return defaultPage;
}

async function newPage(browser) {
  const page = await browser.newPage();
  page.on('console', onConsole);
  return page;
}

async function runScript(page, script) {
  return page.evaluate(script => {
    // nothing can come before the eval statement, or eval will have access to it
    // tslint:disable-next-line:no-eval
    let val = eval(`script = undefined; ${script}`);
    const typeofVal = typeof val;
    let valToString = null;

    try {
      valToString = val.toString();
    } catch (err) {}

    let valName = null;

    try {
      // used for functions
      valName = val.name;
    } catch (err) {}

    const isValSerializable = val === null || typeofVal in {
      undefined: true,
      boolean: true,
      number: true,
      string: true
    } || typeofVal === 'object' && Object.getPrototypeOf(val) === Object.prototype;

    if (!isValSerializable) {
      // trying to return a non-serializable value drops the entire return value
      val = null;
    }

    return {
      val,
      typeofVal,
      valToString,
      valName,
      isValSerializable
    };
  }, script);
}

function onConsole(msg) {
  Promise.all(msg.args().map(arg => arg.jsonValue())).then(args => {
    // tslint:disable-next-line:max-line-length
    // @ts-ignore Element implicitly has an 'any' type because type 'Console' has no index signature.
    console[msg.type()](...args);
  });
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', chunk => {
      chunks.push(chunk);
    });
    process.stdin.once('end', () => {
      resolve(Buffer.concat(chunks));
    });
    process.stdin.once('error', reject);
  });
} // tslint:disable-next-line:max-line-length


const isRecoverableErrorRe = /^Evaluation failed: SyntaxError: (Unexpected end of input|Unexpected token)/;
exports.isRecoverableErrorRe = isRecoverableErrorRe;

function isRecoverableError(err) {
  if (err.name === 'Error') {
    return isRecoverableErrorRe.test(err.message);
  }

  return false;
}

function debug(...args) {
  if (!process.env.DEBUG) {
    return;
  }

  console.error(...args);
}