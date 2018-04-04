#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { getDefaultBrowserAndPage, readStdin, runScript, isRecoverableError, debug } = require('./util');

async function edonInteractive() {
  const repl = require('repl');
  const { browser, page } = await getDefaultBrowserAndPage();
  await new Promise((resolve, reject) => {
    const server = repl.start({
      eval(cmd, context, filename, cb) {
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

async function edonNoninteractive() {
  const [stdin, { browser, page }] = await Promise.all([
    readStdin(),
    getDefaultBrowserAndPage(),
  ]);
  try {
    await runScript(page, stdin.toString('utf8'));
  } catch (err) {
    console.error(err);
  }
  await browser.close();
}

(process.stdin.isTTY
  ? edonInteractive
  : edonNoninteractive
)().catch(console.error);
