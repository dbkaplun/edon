#!/usr/bin/env node
/// <reference types="node" />
import { Browser, Page, ConsoleMessage, LaunchOptions } from 'puppeteer';
export declare function getDefaultBrowserAndPage(opts?: LaunchOptions): Promise<{
    browser: Browser;
    page: Page;
}>;
export declare function getDefaultBrowser(opts?: LaunchOptions): Promise<Browser>;
export declare function getDefaultPage(opts?: LaunchOptions): Promise<Page>;
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
