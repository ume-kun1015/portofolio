// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ["@nuxt/content", "@nuxt/ui"],

  routeRules: {
    "/": { prerender: true },
  },

  content: {
    highlight: {
      theme: {
        default: "material-theme",
      },

      langs: [
        "json",
        "js",
        "ts",
        "html",
        "css",
        "vue",
        "shell",
        "mdc",
        "md",
        "yaml",
        "dart",
        "xml",
        "csv",
        "ruby",
        "go",
      ],
    },
  },

  compatibilityDate: "2024-08-08",
});
