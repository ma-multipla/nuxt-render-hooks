import type { NuxtApp } from '#app';
export declare type NuxtSSRContext = NuxtApp['ssrContext'];
export interface NuxtRenderContext {
    ssrContext: NuxtSSRContext;
    html: {
        htmlAttrs: string[];
        head: string[];
        bodyAttrs: string[];
        bodyPreprend: string[];
        body: string[];
        bodyAppend: string[];
    };
}
declare const _default: import("h3").EventHandler<string>;
export default _default;
