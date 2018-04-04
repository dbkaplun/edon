#!/usr/bin/env node

const puppeteer = require('puppeteer');

module.exports.getDefaultBrowserAndPage = getDefaultBrowserAndPage;
async function getDefaultBrowserAndPage() {
  const [browser, page] = await Promise.all([
    getDefaultBrowser(),
    getDefaultPage(),
  ]);
  return { browser, page };
}

module.exports.getDefaultBrowser = getDefaultBrowser;
async function getDefaultBrowser() {
  if (!await getDefaultBrowser._browser) {
    // this block must not be async
    getDefaultBrowser._browser = puppeteer.launch();
  }
  return getDefaultBrowser._browser;
}
getDefaultBrowser._browser = null;

module.exports.getDefaultPage = getDefaultPage;
async function getDefaultPage() {
  if (!await getDefaultPage._page) {
    // this block must not be async
    getDefaultPage._page = getDefaultBrowser().then(newPage);
  }
  return getDefaultPage._page;
}
getDefaultPage._page = null;

module.exports.newPage = newPage;
async function newPage(browser) {
  const page = await browser.newPage();
  page.on('console', onConsole);
  return page;
}

module.exports.runScript = runScript;
async function runScript(page, script) {
  return page.evaluate((script) => {
    // nothing can come before the eval statement, or eval will have access to it
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
      string: true,
    } || typeofVal === 'object' && Object.getPrototypeOf(val) === Object.prototype;
    if (!isValSerializable) {
      // trying to return a non-serializable value drops the entire return value
      val = null;
    }

    return { val, typeofVal, valToString, valName, isValSerializable };
  }, script);
}

module.exports.onConsole = onConsole;
function onConsole(msg) {
  Promise.all(msg.args().map(arg => arg.jsonValue())).then(args => {
    console[msg.type()](...args);
  });
}

module.exports.readStdin = readStdin;
async function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => { chunks.push(chunk); });
    process.stdin.once('end', () => { resolve(Buffer.concat(chunks)); });
    process.stdin.once('error', reject);
  });
}

module.exports.isRecoverableError = isRecoverableError;
function isRecoverableError(err) {
  if (err.name === 'Error') {
    return isRecoverableError._re.test(err.message);
  }
  return false;
}
isRecoverableError._re = /^Evaluation failed: SyntaxError: (Unexpected end of input|Unexpected token)/;

module.exports.debug = debug;
function debug(...args) {
  if (!debug._isEnabled) {
    return;
  }
  console.error(...args);
}
debug._isEnabled = Boolean(process.env.DEBUG);
