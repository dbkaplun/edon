#!/usr/bin/env node

import puppeteer, { Browser, Page, ConsoleMessage, LaunchOptions } from 'puppeteer';

export async function getDefaultBrowserAndPage(opts?: LaunchOptions): Promise<{
  browser: Browser,
  page: Page,
}> {
  const [browser, page] = await Promise.all([
    getDefaultBrowser(opts),
    getDefaultPage(opts),
  ]);
  return { browser, page };
}

let defaultBrowser: Promise<Browser>;
export async function getDefaultBrowser(opts?: LaunchOptions): Promise<Browser> {
  if (!await defaultBrowser) {
    // this block must not be async
    const args = [...(opts || {}).args || []];
    if (process.env.TRAVIS) args.push('--no-sandbox');
    const launchOpts = { ...opts, args };
    defaultBrowser = puppeteer.launch(launchOpts);
  }
  return defaultBrowser;
}

let defaultPage: Promise<Page>;
export async function getDefaultPage(opts?: LaunchOptions): Promise<Page> {
  if (!await defaultPage) {
    // this block must not be async
    defaultPage = getDefaultBrowser(opts).then(newPage);
  }
  return defaultPage;
}

export async function newPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  page.on('console', onConsole);
  return page;
}

export interface RunScriptResult {
  val: any;
  typeofVal: string;
  valToString: string;
  valName: string;
  isValSerializable: boolean;
}

export async function runScript(page: Page, script: string): Promise<RunScriptResult> {
  return page.evaluate(
    (script) => {
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
        string: true,
      } || typeofVal === 'object' && Object.getPrototypeOf(val) === Object.prototype;
      if (!isValSerializable) {
        // trying to return a non-serializable value drops the entire return value
        val = null;
      }

      return { val, typeofVal, valToString, valName, isValSerializable };
    },
    script,
  );
}

export function onConsole(msg: ConsoleMessage) {
  Promise.all(msg.args().map(arg => arg.jsonValue())).then((args) => {
    // tslint:disable-next-line:max-line-length
    // @ts-ignore Element implicitly has an 'any' type because type 'Console' has no index signature.
    console[msg.type()](...args);
  });
}

export async function readStdin(): Promise<Buffer> {
  return new Promise((resolve: (buf: Buffer) => any, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk) => { chunks.push(chunk); });
    process.stdin.once('end', () => { resolve(Buffer.concat(chunks)); });
    process.stdin.once('error', reject);
  });
}

// tslint:disable-next-line:max-line-length
export const isRecoverableErrorRe = /^Evaluation failed: SyntaxError: (Unexpected end of input|Unexpected token)/;
export function isRecoverableError(err: Error): boolean {
  if (err.name === 'Error') {
    return isRecoverableErrorRe.test(err.message);
  }
  return false;
}

export function debug(...args: any[]) {
  if (!process.env.DEBUG) {
    return;
  }
  console.error(...args);
}
