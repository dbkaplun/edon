#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.edonInteractive = edonInteractive;
exports.edonNoninteractive = edonNoninteractive;

var _util = require("./util");

async function edonInteractive() {
  const repl = require('repl');

  const {
    browser,
    page
  } = await (0, _util.getDefaultBrowserAndPage)();
  await new Promise((resolve, reject) => {
    const server = repl.start({
      eval(cmd, context, filename, cb) {
        const isFunctionDeclaration = /^(\s*)function(\s+)([$_\w]+)(\s*)\(/.test(cmd);

        if (isFunctionDeclaration) {
          context.ctx += `;${cmd}`;
        }

        (0, _util.runScript)(page, `${context.ctx};${cmd}`).then(res => {
          (0, _util.debug)('runScript .then:', res);
          const {
            val,
            valToString,
            typeofVal,
            valName,
            isValSerializable
          } = res;
          let useToString = !isValSerializable;
          let retVal = val;

          switch (typeofVal) {
            case 'function':
              useToString = false;
              retVal = new Function();
              Object.defineProperty(retVal, 'name', {
                value: valName
              });
              break;

            default:
              break;
          }

          cb(null, useToString ? valToString : retVal);
        }, err => {
          let cbErr = err;

          if ((0, _util.isRecoverableError)(cbErr)) {
            (0, _util.debug)('isRecoverableError:', cbErr);
            cbErr = new repl.Recoverable(cbErr);
          }

          cb(cbErr);
        }).catch(err => {
          server.close();
          reject(err);
        });
      }

    });
    server.context.ctx = '';
    server.once('error', reject);
    server.once('exit', resolve);
  });
  await browser.close();
}

async function edonNoninteractive() {
  const [stdin, {
    browser,
    page
  }] = await Promise.all([(0, _util.readStdin)(), (0, _util.getDefaultBrowserAndPage)()]);

  try {
    await (0, _util.runScript)(page, stdin.toString('utf8'));
  } catch (err) {
    console.error(err);
  }

  await browser.close();
}

if (process.mainModule === module) {
  (process.stdin.isTTY ? edonInteractive : edonNoninteractive)().catch(console.error);
}