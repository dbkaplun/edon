#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function getBrowser() {
  if (!getBrowser._browser) {
    getBrowser._browser = await puppeteer.launch();
  }
  return getBrowser._browser;
}
getBrowser._browser = null;

async function runScript(script) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  page.on('console', onConsole);
  return page.evaluate((script) => { eval(script); }, script.toString('utf8'));
}

function onConsole(msg) {
  Promise.all(msg.args().map(arg => arg.jsonValue())).then(args => {
    console[msg.type()](...args);
  });
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => { chunks.push(chunk); });
    process.stdin.on('end', () => { resolve(Buffer.concat(chunks)); });
    process.stdin.once('error', reject);
  });
}

async function start() {
  const stdin = await readStdin();
  try {
    await runScript(stdin);
  } catch (err) {
    console.error(err);
  }
  const browser = await getBrowser();
  await browser.close();
}

start().catch(console.error);
