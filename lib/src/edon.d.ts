#!/usr/bin/env node
import { LaunchOptions } from 'puppeteer';
export interface EdonInteractiveContext {
    ctx: string;
}
export declare function edonInteractive(opts?: LaunchOptions): Promise<void>;
export declare function edonNoninteractive(opts?: LaunchOptions): Promise<void>;
