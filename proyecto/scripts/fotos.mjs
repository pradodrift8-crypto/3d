// uso: node scripts/fotos.mjs <prefijo> <cuadro,cuadro,...> [escala]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME || undefined;
const chromiumOptions = { gl: process.env.GL || "angle" };
const inputProps = { mute: true };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "Alejandro", chromiumOptions, inputProps, browserExecutable });
const onBrowserLog = (l) => { if (l.type === "error") console.log("[error]", l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale), chromiumOptions, inputProps, browserExecutable, timeoutInMilliseconds: 600000, onBrowserLog });
  console.log("foto", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
