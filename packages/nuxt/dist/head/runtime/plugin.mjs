import { computed, getCurrentInstance, markRaw } from "vue";
import * as Components from "./components.mjs";
import { useHead } from "./composables.mjs";
import { defineNuxtPlugin, useNuxtApp } from "#app";
import metaConfig from "#build/meta.config.mjs";
const metaMixin = {
  created() {
    const instance = getCurrentInstance();
    if (!instance) {
      return;
    }
    const options = instance.type;
    if (!options || !("head" in options)) {
      return;
    }
    const nuxtApp = useNuxtApp();
    const source = typeof options.head === "function" ? computed(() => options.head(nuxtApp)) : options.head;
    useHead(source);
  }
};
export default defineNuxtPlugin((nuxtApp) => {
  useHead(markRaw({ title: "", ...metaConfig.globalMeta }));
  nuxtApp.vueApp.mixin(metaMixin);
  for (const name in Components) {
    nuxtApp.vueApp.component(name, Components[name]);
  }
});