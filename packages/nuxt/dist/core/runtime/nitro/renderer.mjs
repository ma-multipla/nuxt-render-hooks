import { createRenderer } from "vue-bundle-renderer";
import { eventHandler, useQuery } from "h3";
import devalue from "@nuxt/devalue";
import { renderToString as _renderToString } from "vue/server-renderer";
import { useRuntimeConfig, useNitroApp } from "#internal/nitro";
import { buildAssetsURL } from "#paths";
const getClientManifest = () => import("#build/dist/server/client.manifest.mjs").then((r) => r.default || r).then((r) => typeof r === "function" ? r() : r);
const getServerEntry = () => import("#build/dist/server/server.mjs").then((r) => r.default || r);
const getSSRRenderer = lazyCachedFunction(async () => {
  const clientManifest = await getClientManifest();
  if (!clientManifest) {
    throw new Error("client.manifest is not available");
  }
  const createSSRApp = await getServerEntry();
  if (!createSSRApp) {
    throw new Error("Server bundle is not available");
  }
  const renderer = createRenderer(createSSRApp, {
    clientManifest,
    renderToString,
    publicPath: buildAssetsURL()
  });
  async function renderToString(input, context) {
    const html = await _renderToString(input, context);
    if (process.dev && process.env.NUXT_VITE_NODE_OPTIONS) {
      renderer.rendererContext.updateManifest(await getClientManifest());
    }
    return `<div id="__nuxt">${html}</div>`;
  }
  return renderer;
});
const getSPARenderer = lazyCachedFunction(async () => {
  const clientManifest = await getClientManifest();
  const renderToString = (ssrContext) => {
    const config = useRuntimeConfig();
    ssrContext.payload = {
      serverRendered: false,
      config: {
        public: config.public,
        app: config.app
      }
    };
    let entryFiles = Object.values(clientManifest).filter((fileValue) => fileValue.isEntry);
    if ("all" in clientManifest && "initial" in clientManifest) {
      entryFiles = clientManifest.initial.map(
        (file) => file.endsWith("css") ? { css: file } : { file }
      );
    }
    return Promise.resolve({
      html: '<div id="__nuxt"></div>',
      renderResourceHints: () => "",
      renderStyles: () => entryFiles.flatMap(({ css }) => css).filter((css) => css != null).map((file) => `<link rel="stylesheet" href="${buildAssetsURL(file)}">`).join(""),
      renderScripts: () => entryFiles.filter(({ file }) => file).map(({ file }) => {
        const isMJS = !file.endsWith(".js");
        return `<script ${isMJS ? 'type="module"' : ""} src="${buildAssetsURL(file)}"><\/script>`;
      }).join("")
    });
  };
  return { renderToString };
});
export default eventHandler(async (event) => {
  const ssrError = event.req.url?.startsWith("/__nuxt_error") ? useQuery(event) : null;
  const url = ssrError?.url || event.req.url;
  const ssrContext = {
    url,
    event,
    req: event.req,
    res: event.res,
    runtimeConfig: useRuntimeConfig(),
    noSSR: !!event.req.headers["x-nuxt-no-ssr"],
    error: ssrError,
    nuxt: void 0,
    payload: void 0
  };
  const renderer = process.env.NUXT_NO_SSR || ssrContext.noSSR ? await getSPARenderer() : await getSSRRenderer();
  const _rendered = await renderer.renderToString(ssrContext).catch((err) => {
    if (!ssrError) {
      throw err;
    }
  });
  if (!_rendered) {
    return;
  }
  if (ssrContext.error && !ssrError) {
    throw ssrContext.error;
  }
  const renderedMeta = await ssrContext.renderMeta();
  const rendered = {
    ssrContext,
    html: {
      htmlAttrs: normalizeChunks([renderedMeta.htmlAttrs]),
      head: normalizeChunks([
        renderedMeta.headTags,
        _rendered.renderResourceHints(),
        _rendered.renderStyles(),
        ssrContext.styles
      ]),
      bodyAttrs: normalizeChunks([renderedMeta.bodyAttrs]),
      bodyPreprend: normalizeChunks([
        renderedMeta.bodyScriptsPrepend,
        ssrContext.teleports?.body
      ]),
      body: [
        _rendered.html
      ],
      bodyAppend: normalizeChunks([
        `<script>window.__NUXT__=${devalue(ssrContext.payload)}<\/script>`,
        _rendered.renderScripts(),
        renderedMeta.bodyScripts
      ])
    }
  };
  const nitroApp = useNitroApp();
  await ssrContext.nuxt.hooks.callHook("app:rendered", rendered);
  await nitroApp.hooks.callHook("nuxt:app:rendered", rendered);
  const html = renderHTMLDocument(rendered);
  await nitroApp.hooks.callHook("nuxt:app:rendered:html", { html });
  if (event.res.writableEnded) {
    return;
  }
  event.res.setHeader("Content-Type", "text/html;charset=UTF-8");
  return html;
});
function lazyCachedFunction(fn) {
  let res = null;
  return () => {
    if (res === null) {
      res = fn().catch((err) => {
        res = null;
        throw err;
      });
    }
    return res;
  };
}
function normalizeChunks(chunks) {
  return chunks.filter(Boolean).map((i) => i.trim());
}
function joinTags(tags) {
  return tags.join("");
}
function joinAttrs(chunks) {
  return chunks.join(" ");
}
function renderHTMLDocument(rendered) {
  return `<!DOCTYPE html>
<html ${joinAttrs(rendered.html.htmlAttrs)}>
<head>${joinTags(rendered.html.head)}</head>
<body ${joinAttrs(rendered.html.bodyAttrs)}>${joinTags(rendered.html.bodyPreprend)}${joinTags(rendered.html.body)}${joinTags(rendered.html.bodyAppend)}</body>
</html>`;
}
