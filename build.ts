#!/usr/bin/env bun
import plugin from "bun-plugin-tailwind";
import { existsSync } from "fs";
import { copyFile, mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🏗️  Bun Build Script

Usage: bun run build.ts [options]

Common Options:
  --outdir <path>          Output directory (default: "dist")
  --minify                 Enable minification (or --minify.whitespace, --minify.syntax, etc)
  --sourcemap <type>      Sourcemap type: none|linked|inline|external
  --target <target>        Build target: browser|bun|node
  --format <format>        Output format: esm|cjs|iife
  --splitting              Enable code splitting
  --packages <type>        Package handling: bundle|external
  --public-path <path>     Public path for assets
  --env <mode>             Environment handling: inline|disable|prefix*
  --conditions <list>      Package.json export conditions (comma separated)
  --external <list>        External packages (comma separated)
  --banner <text>          Add banner text to output
  --footer <text>          Add footer text to output
  --define <obj>           Define global constants (e.g. --define.VERSION=1.0.0)
  --help, -h               Show this help message

Example:
  bun run build.ts --outdir=dist --minify --sourcemap=linked --external=react,react-dom
`);
  process.exit(0);
}

const toCamelCase = (str: string): string =>
  str.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());

const parseValue = (value: string): any => {
  if (value === "true") return true;
  if (value === "false") return false;

  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d*\.\d+$/.test(value)) return parseFloat(value);

  if (value.includes(",")) return value.split(",").map((v) => v.trim());

  return value;
};

function parseArgs(): Partial<Bun.BuildConfig> {
  const config: Record<string, unknown> = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;
    if (!arg.startsWith("--")) continue;

    if (arg.startsWith("--no-")) {
      const key = toCamelCase(arg.slice(5));
      config[key] = false;
      continue;
    }

    if (
      !arg.includes("=") &&
      (i === args.length - 1 || args[i + 1]?.startsWith("--"))
    ) {
      const key = toCamelCase(arg.slice(2));
      config[key] = true;
      continue;
    }

    let key: string;
    let value: string;

    if (arg.includes("=")) {
      [key, value] = arg.slice(2).split("=", 2) as [string, string];
    } else {
      key = arg.slice(2);
      value = args[++i] ?? "";
    }

    key = toCamelCase(key);

    if (key.includes(".")) {
      const [parentKey, childKey] = key.split(".");
      if (!parentKey || !childKey) continue;
      const nested = (config[parentKey] as Record<string, unknown> | undefined) ?? {};
      nested[childKey] = parseValue(value);
      config[parentKey] = nested;
    } else {
      config[key] = parseValue(value);
    }
  }

  return config as Partial<Bun.BuildConfig>;
}

const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

console.log("\n🚀 Starting build process...\n");

type AppTarget = "all" | "things_web" | "admin" | "chat_app";

const APP_ENTRYPOINTS: Record<Exclude<AppTarget, "all">, string> = {
  things_web: path.resolve("src/things_web/index.html"),
  admin: path.resolve("src/admin/index.html"),
  chat_app: path.resolve("src/chat_app/index.html"),
};

const resolveAppTarget = (value: unknown): AppTarget => {
  if (value === "things_web" || value === "admin" || value === "chat_app") {
    return value;
  }
  return "all";
};

const cliConfig = parseArgs() as Partial<Bun.BuildConfig> & {
  app?: string;
};
const appTarget = resolveAppTarget(cliConfig.app);
delete cliConfig.app;

const outdir =
  typeof cliConfig.outdir === "string"
    ? cliConfig.outdir
    : appTarget === "all"
      ? path.join(process.cwd(), "dist")
      : path.join(process.cwd(), "dist", appTarget);

if (existsSync(outdir)) {
  console.log(`🗑️ Cleaning previous build at ${outdir}`);
  await rm(outdir, { recursive: true, force: true });
}

const start = performance.now();

const entrypoints =
  appTarget === "all"
    ? Object.values(APP_ENTRYPOINTS).filter((entry) => existsSync(entry))
    : [APP_ENTRYPOINTS[appTarget]].filter((entry) => existsSync(entry));
console.log(
  `📄 Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process\n`,
);

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [plugin],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  ...cliConfig,
});

const ensureEntrypoint = async (
  targetPath: string,
  candidatePaths: string[],
) => {
  if (existsSync(targetPath)) {
    return false;
  }

  for (const candidatePath of candidatePaths) {
    if (!existsSync(candidatePath)) {
      continue;
    }
    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(candidatePath, targetPath);
    return true;
  }

  return false;
};

const normalizeStandaloneAssetPath = (rawPath: string) =>
  `/${rawPath.replace(/^(?:\.\.\/|\.\/)+/, "")}`;

const rewriteStandaloneHtmlAssetPaths = (html: string) =>
  html.replace(
    /(href|src)=["']((?:\.\.\/|\.\/)+[^"']+)["']/g,
    (_match, attr: string, rawPath: string) =>
      `${attr}="${normalizeStandaloneAssetPath(rawPath)}"`,
  );

if (appTarget === "all") {
  const normalized = (segment: string) => path.join(outdir, segment, "index.html");
  const patchedEntrypoints = await Promise.all([
    ensureEntrypoint(path.join(outdir, "index.html"), [
      normalized("src/things_web"),
      normalized("things_web"),
    ]),
    ensureEntrypoint(normalized("admin"), [normalized("src/admin")]),
    ensureEntrypoint(normalized("chat_app"), [normalized("src/chat_app")]),
  ]);

  if (patchedEntrypoints.some(Boolean)) {
    console.log("🧩 Normalized SPA entrypoints for Cloudflare routing.");
  }
} else {
  const standaloneIndexPath = path.join(outdir, "index.html");
  const nestedCandidates = [
    path.join(outdir, appTarget, "index.html"),
    path.join(outdir, "src", appTarget, "index.html"),
  ];
  const normalized = await ensureEntrypoint(standaloneIndexPath, nestedCandidates);
  if (existsSync(standaloneIndexPath)) {
    const html = await readFile(standaloneIndexPath, "utf8");
    const patchedHtml = rewriteStandaloneHtmlAssetPaths(html);
    if (patchedHtml !== html) {
      await writeFile(standaloneIndexPath, patchedHtml, "utf8");
    }
  }

  await writeFile(path.join(outdir, "_redirects"), "/* /index.html 200\n", "utf8");
  console.log(
    `🧩 Standalone build ready for ${appTarget} at ${outdir}${normalized ? " (normalized entrypoint)" : ""}`,
  );
}

const end = performance.now();

const outputTable = result.outputs.map((output) => ({
  File: path.relative(process.cwd(), output.path),
  Type: output.kind,
  Size: formatFileSize(output.size),
}));

console.table(outputTable);
const buildTime = (end - start).toFixed(2);

console.log(`\n✅ Build completed in ${buildTime}ms\n`);
