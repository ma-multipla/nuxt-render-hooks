import { defineComponent, h, inject, provide, Suspense, Transition } from "vue";
import { RouterView } from "vue-router";
import { generateRouteKey, wrapInKeepAlive } from "./utils.mjs";
import { useNuxtApp } from "#app";
import { _wrapIf } from "#app/components/utils";
const isNestedKey = Symbol("isNested");
export default defineComponent({
  name: "NuxtPage",
  inheritAttrs: false,
  props: {
    name: {
      type: String
    },
    route: {
      type: Object
    },
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props, { attrs }) {
    const nuxtApp = useNuxtApp();
    const isNested = inject(isNestedKey, false);
    provide(isNestedKey, true);
    return () => {
      return h(RouterView, { name: props.name, route: props.route, ...attrs }, {
        default: (routeProps) => routeProps.Component && _wrapIf(
          Transition,
          routeProps.route.meta.pageTransition ?? defaultPageTransition,
          wrapInKeepAlive(
            routeProps.route.meta.keepalive,
            isNested && nuxtApp.isHydrating ? h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) : h(Suspense, {
              onPending: () => nuxtApp.callHook("page:start", routeProps.Component),
              onResolve: () => nuxtApp.callHook("page:finish", routeProps.Component)
            }, { default: () => h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) })
          )
        ).default()
      });
    };
  }
});
const defaultPageTransition = { name: "page", mode: "out-in" };