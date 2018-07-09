#!/usr/bin/env node

import { LaunchOptions } from 'puppeteer';

import { getDefaultBrowserAndPage, readStdin, runScript, isRecoverableError, debug } from './util';

export interface EdonInteractiveContext {
  ctx: string;
}

export async function edonInteractive(opts?: LaunchOptions) {
  const repl = require('repl');
  const { browser, page } = await getDefaultBrowserAndPage(opts);
  await new Promise((resolve, reject) => {
    const server = repl.start({
      eval(
        cmd: string,
        context: EdonInteractiveContext,
        filename: string,
        cb: (err: Error | null, res?: any) => any,
      ) {
        const isFunctionDeclaration = /^(\s*)function(\s+)([$_\w]+)(\s*)\(/.test(cmd);
        if (isFunctionDeclaration) {
          context.ctx += `;${cmd}`;
        }

        runScript(page, `${context.ctx};${cmd}`).then(
          (res) => {
            debug('runScript .then:', res);
            const { val, valToString, typeofVal, valName, isValSerializable } = res;
            let useToString = !isValSerializable;
            let retVal = val;
            switch (typeofVal) {
              case 'function':
                useToString = false;
                retVal = new Function();
                Object.defineProperty(retVal, 'name', { value: valName });
                break;
              default: break;
            }
            cb(null, useToString ? valToString : retVal);
          },
          (err) => {
            let cbErr = err;
            if (isRecoverableError(cbErr)) {
              debug('isRecoverableError:', cbErr);
              cbErr = new repl.Recoverable(cbErr);
            }
            cb(cbErr);
          },
        )
        .catch((err) => {
          server.close();
          reject(err);
        });
      },
    });
    server.context.ctx = '';
    server.once('error', reject);
    server.once('exit', resolve);
  });
  await browser.close();
}

export async function edonNoninteractive(opts?: LaunchOptions) {
  const [stdin, { browser, page }] = await Promise.all([
    readStdin(),
    getDefaultBrowserAndPage(opts),
  ]);
  try {
    await runScript(page, stdin.toString('utf8'));
  } catch (err) {
    console.error(err);
  }
  await browser.close();
}

if (process.mainModule === module) {
  (process.stdin.isTTY
    ? edonInteractive
    : edonNoninteractive
  )().catch(console.error);
}
