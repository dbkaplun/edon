#!/usr/bin/env node
export interface EdonInteractiveContext {
    ctx: string;
}
export declare function edonInteractive(): Promise<void>;
export declare function edonNoninteractive(): Promise<void>;
