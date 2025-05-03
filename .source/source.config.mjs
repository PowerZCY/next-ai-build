// source.config.ts
import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { remarkInstall } from "fumadocs-docgen";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
var remarkInstallOptions = {
  persist: {
    id: "d8ger"
  }
};
var docs = defineDocs({
  dir: "src/mdx"
});
var source_config_default = defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMath, [remarkInstall, remarkInstallOptions]],
    // Place it at first, it should be executed before the syntax highlighter
    rehypePlugins: (v) => [rehypeKatex, ...v]
  }
});
export {
  source_config_default as default,
  docs
};
