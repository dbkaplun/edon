#!/usr/bin/env node
/// <reference types="node" />
import { Browser, Page, ConsoleMessage } from 'puppeteer';
export declare function getDefaultBrowserAndPage(): Promise<{
    browser: Browser;
    page: Page;
}>;
export declare function getDefaultBrowser(): Promise<Browser>;
export declare function getDefaultPage(): Promise<Page>;
export declare function newPage(browser: Browser): Promise<Page>;
export interface RunScriptResult {
    val: any;
    typeofVal: string;
    valToString: string;
    valName: string;
    isValSerializable: boolean;
}
export declare function runScript(page: Page, script: string): Promise<RunScriptResult>;
export declare function onConsole(msg: ConsoleMessage): void;
export declare function readStdin(): Promise<Buffer>;
export declare const isRecoverableErrorRe: RegExp;
export declare function isRecoverableError(err: Error): boolean;
export declare function debug(...args: any[]): void;
