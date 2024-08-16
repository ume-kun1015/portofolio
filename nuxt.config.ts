import { globSync } from "glob";

const getContentRoutes = (): string[] => {
  const routeNames = globSync("src/content/**/*.md").map((f) => {
    const replaced = f
      .replaceAll("\\", "/")
      .replaceAll("src/content", "")
      .replace(".md", "");
    return `/blogs${replaced}`;
  });

  return [...routeNames];
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  nitro: {
    preset: "cloudflare-pages",

    prerender: {
      routes: getContentRoutes(),
    },
  },

  modules: ["@nuxt/content", "@nuxt/ui", "@nuxt/image"],

  routeRules: {
    "/": { prerender: true },
  },

  srcDir: "src", // プロジェクト全体の設定ファイルと nuxt 関連のファイルを混ぜないようにするため

  ui: {
    global: true,
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
        "diff",
        "docker",
        "dotenv",
      ],
    },
  },

  compatibilityDate: "2024-08-08",
});
