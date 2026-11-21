// Captures du guide utilisateur (ADR 0037, GUIDE-02).
//   npm run docs:screenshots   (depuis docs/site)
// Installe une démonstration JETABLE (projet Compose tunnel-demo-guide, port libre, fichier
// d'environnement temporaire), prend les captures listées dans captures.json avec Chromium,
// les encode en WebP dans le navigateur (aucun outil d'image), puis supprime tout.
// Garde-fous : refuse le projet « tunnel-demo » (démonstration publique), « tunnel » (base de
// dev) et les ports 8080 et 8090. Aucune commande Docker sans -p sur le projet jetable.
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../..");
const DEMO_DIR = path.join(REPO, "deploy/demo");
const OUT_DIR = path.resolve(HERE, "../public/captures");
const PROJECT = "tunnel-demo-guide";
const FIRST_PORT = 18190;
const FORBIDDEN_PORTS = [8080, 8090];
const FORBIDDEN_PROJECTS = ["tunnel", "tunnel-demo"];
const VIEWPORTS = {
  web: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const ACCOUNTS = { technicien: "technicien", acheteur: "acheteur", direction: "direction" };

function assertSafe(project, port) {
  if (FORBIDDEN_PROJECTS.includes(project) || !/^tunnel-demo-[a-z0-9]+$/.test(project)) {
    throw new Error(`projet « ${project} » refusé : seul tunnel-demo-<suffixe> est permis`);
  }
  if (FORBIDDEN_PORTS.includes(port)) throw new Error(`port ${port} refusé (base de dev ou démonstration publique)`);
}

function randomToken(length) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function pickPort() {
  for (let port = FIRST_PORT; port < FIRST_PORT + 100; port += 1) {
    if (!FORBIDDEN_PORTS.includes(port) && (await isPortFree(port))) return port;
  }
  throw new Error("aucun port libre trouvé");
}

function writeEnvFile(dir, port, password) {
  const values = {
    DB_OWNER_PASSWORD: randomToken(32),
    DB_APP_PASSWORD: randomToken(32),
    JWT_SECRET_KEY: randomToken(64),
    ADMIN_EMAIL: "admin@guide.example.com",
    DEMO_PASSWORD: password,
    HTTP_PORT: String(port),
    PUBLIC_URL: `http://localhost:${port}`,
  };
  const lines = readFileSync(path.join(DEMO_DIR, ".env.demo.example"), "utf8")
    .split("\n")
    .map((line) => {
      const key = line.split("=")[0];
      return key in values && !line.startsWith("#") ? `${key}=${values[key]}` : line;
    });
  const file = path.join(dir, "env");
  writeFileSync(file, lines.join("\n"), { mode: 0o600 });
  return file;
}

function compose(envFile, password, args, options = {}) {
  return spawnSync(
    "docker",
    ["compose", "-p", PROJECT, "--env-file", envFile, "-f", path.join(REPO, "deploy/docker-compose.yml"),
      "-f", path.join(DEMO_DIR, "docker-compose.demo.yml"), ...args],
    { env: { ...process.env, DEMO_PASSWORD: password }, encoding: "utf8", ...options },
  );
}

function chromiumPath() {
  if (process.env.TUNNEL_CHROMIUM) return process.env.TUNNEL_CHROMIUM;
  const cache = path.join(homedir(), ".cache/ms-playwright");
  const shell = existsSync(cache) ? readdirSync(cache).filter((n) => n.startsWith("chromium_headless_shell-")).sort().pop() : null;
  if (!shell) throw new Error("Chromium introuvable : définir TUNNEL_CHROMIUM ou installer le cache Playwright");
  const dir = path.join(cache, shell);
  const sub = readdirSync(dir).find((n) => n.startsWith("chrome-headless-shell"));
  return path.join(dir, sub, "chrome-headless-shell");
}

async function waitHealthy(baseUrl) {
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {
      // pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("la démonstration jetable ne répond pas sur /api/health");
}

async function login(browser, baseUrl, account, app, password) {
  const context = await browser.newContext({ ...VIEWPORTS[app], locale: "fr-FR", timezoneId: "Europe/Paris" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${app === "mobile" ? "/m" : ""}/login`);
  await page.waitForLoadState("networkidle"); // l'application doit être montée avant la saisie
  await page.locator("input[type=email]").fill(`${ACCOUNTS[account]}@demo.frezille.fr`);
  await page.locator("input[type=password]").fill(password);
  await page.locator("button[type=submit]").click();
  try {
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20000 });
  } catch (error) {
    const text = (await page.locator("body").innerText()).slice(0, 300).replace(/\s+/g, " ");
    throw new Error(`connexion ${account}/${app} échouée : ${text}`, { cause: error });
  }
  await page.close();
  return context;
}

async function runStep(page, step) {
  if (step.clic) await page.getByText(step.clic, { exact: false }).first().click();
  else if (step.clicPremier) await page.locator(step.clicPremier).first().click();
  else if (step.defiler) await page.getByText(step.defiler, { exact: false }).first().scrollIntoViewIfNeeded();
  else if (step.pause) await page.waitForTimeout(step.pause);
  else if (step.attendre) await page.getByText(step.attendre, { exact: false }).first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(500);
}

async function toWebp(helper, png) {
  const dataUrl = await helper.evaluate(async (source) => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d").drawImage(image, 0, 0);
    return canvas.toDataURL("image/webp", 0.85);
  }, `data:image/png;base64,${png.toString("base64")}`);
  const prefix = "data:image/webp;base64,";
  if (!dataUrl.startsWith(prefix)) throw new Error("ce Chromium ne sait pas encoder en WebP");
  return Buffer.from(dataUrl.slice(prefix.length), "base64");
}

async function capture(context, helper, baseUrl, entry) {
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}${entry.app === "mobile" ? "/m" : ""}${entry.chemin}`);
    const { texte, selecteur } = entry.attente;
    const target = texte ? page.getByText(texte, { exact: false }).first() : page.locator(selecteur).first();
    await target.waitFor({ timeout: 20000 });
    for (const step of entry.etapes ?? []) await runStep(page, step);
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(800);
    const webp = await toWebp(helper, await page.screenshot({ type: "png" }));
    writeFileSync(path.join(OUT_DIR, `${entry.id}.webp`), webp);
    console.log(`  ${entry.id}.webp (${webp.length} octets)`);
  } catch (error) {
    // Diagnostic facultatif : état de la page au moment de l'échec.
    if (process.env.CAPTURES_DEBUG_DIR) {
      await page.screenshot({ path: path.join(process.env.CAPTURES_DEBUG_DIR, `${entry.id}.png`) }).catch(() => {});
    }
    throw error;
  } finally {
    await page.close();
  }
}

async function main() {
  const manifest = JSON.parse(readFileSync(path.join(HERE, "captures.json"), "utf8")).captures;
  const only = process.env.CAPTURES_ONLY?.split(",");
  const entries = only ? manifest.filter((e) => only.includes(e.id)) : manifest;
  const port = await pickPort();
  assertSafe(PROJECT, port);
  const password = `Guide${randomToken(8)}7`;
  const workDir = mkdtempSync(path.join(tmpdir(), "tunnel-guide-"));
  const envFile = writeEnvFile(workDir, port, password);
  const baseUrl = `http://127.0.0.1:${port}`;
  let browser = null;
  const cleanup = () => {
    console.log("nettoyage : projet jetable et fichier d'environnement");
    const result = compose(envFile, password, ["down", "-v", "--remove-orphans"], { stdio: "inherit" });
    if (result.status !== 0) console.error(`ATTENTION : docker compose down a échoué (code ${result.status})`);
    rmSync(workDir, { recursive: true, force: true });
  };
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { cleanup(); process.exit(130); });
  try {
    console.log(`démonstration jetable ${PROJECT} sur le port ${port} (peut prendre plusieurs minutes)`);
    execFileSync(path.join(DEMO_DIR, "reset-demo.sh"), [], {
      stdio: "inherit",
      env: { ...process.env, DEMO_COMPOSE_PROJECT: PROJECT, DEMO_ENV_FILE: envFile, DEMO_PASSWORD: password },
    });
    await waitHealthy(baseUrl);
    browser = await chromium.launch({ executablePath: chromiumPath() });
    const helper = await (await browser.newContext()).newPage();
    const sessions = new Map();
    const failures = [];
    for (const entry of entries) {
      const key = `${entry.compte}/${entry.app}`;
      if (!sessions.has(key)) sessions.set(key, await login(browser, baseUrl, entry.compte, entry.app, password));
      try {
        await capture(sessions.get(key), helper, baseUrl, entry);
      } catch (error) {
        failures.push(entry.id);
        console.error(`  ÉCHEC ${entry.id} : ${String(error.message).split("\n")[0]}`);
      }
    }
    console.log(`${entries.length - failures.length}/${entries.length} captures dans ${OUT_DIR}`);
    if (failures.length) process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
