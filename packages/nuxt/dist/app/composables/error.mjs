import { createError as _createError } from "h3";
import { useNuxtApp, useState } from "#app";
export const useError = () => {
  const nuxtApp = useNuxtApp();
  return useState("error", () => process.server ? nuxtApp.ssrContext.error : nuxtApp.payload.error);
};
export const showError = (_err) => {
  const err = createError(_err);
  err.fatal = true;
  try {
    const nuxtApp = useNuxtApp();
    nuxtApp.callHook("app:error", err);
    if (process.server) {
      nuxtApp.ssrContext.error = nuxtApp.ssrContext.error || err;
    } else {
      const error = useError();
      error.value = error.value || err;
    }
  } catch {
    throw err;
  }
  return err;
};
export const throwError = showError;
export const clearError = async (options = {}) => {
  const nuxtApp = useNuxtApp();
  const error = useError();
  nuxtApp.callHook("app:error:cleared", options);
  if (options.redirect) {
    await nuxtApp.$router.replace(options.redirect);
  }
  error.value = null;
};
export const isNuxtError = (err) => err && typeof err === "object" && "__nuxt_error" in err;
export const createError = (err) => {
  const _err = _createError(err);
  _err.__nuxt_error = true;
  return _err;
};