#!/usr/bin/env node

/**
 * Vérifie le format du CHANGELOG.md racine, source unique des nouveautés.
 *
 * Le backend (api/changelog/parser.py) lit ce fichier pour l'écran « Nouveautés » et
 * ignore en silence une version mal formée : ce script rend l'erreur visible avant le
 * commit. Règles :
 * - un titre `##` est soit « Non publié », soit `## [X.Y.Z] — AAAA-MM-JJ` ;
 * - « Non publié », s'il existe, vient avant toutes les versions ;
 * - les versions sont uniques, en ordre décroissant, et leurs dates aussi ;
 * - chaque entrée `- ` se trouve sous une section `###`.
 *
 * Usage : node scripts/validate-changelog.cjs [chemin du CHANGELOG]
 */

const fs = require('fs');
const path = require('path');

const UNRELEASED = 'Non publié';
const VERSION_RE = /^## \[(\d+)\.(\d+)\.(\d+)\] — (\d{4}-\d{2}-\d{2})$/;

function compareVersions(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function isValidDate(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso);
}

function checkVersionHeader(line, lineNo, state, errors) {
  const match = line.match(VERSION_RE);
  if (!match) {
    errors.push(`ligne ${lineNo} : titre attendu « ## ${UNRELEASED} » ou « ## [X.Y.Z] — AAAA-MM-JJ », trouvé « ${line} »`);
    return;
  }
  const version = match.slice(1, 4).map(Number);
  const date = match[4];
  const label = version.join('.');
  if (!isValidDate(date)) errors.push(`ligne ${lineNo} : date invalide ${date} pour ${label}`);
  if (state.previous) {
    if (compareVersions(version, state.previous.version) >= 0) {
      errors.push(`ligne ${lineNo} : ${label} doit être inférieure à ${state.previous.version.join('.')} (ordre décroissant, sans doublon)`);
    }
    if (date > state.previous.date) {
      errors.push(`ligne ${lineNo} : la date de ${label} (${date}) est postérieure à celle de ${state.previous.version.join('.')} (${state.previous.date})`);
    }
  }
  state.previous = { version, date };
}

function validate(content) {
  const errors = [];
  const state = { previous: null, inRelease: false, inSection: false };

  content.split(/\r?\n/).forEach((line, index) => {
    const lineNo = index + 1;
    if (line.startsWith('## ')) {
      state.inRelease = true;
      state.inSection = false;
      if (line === `## ${UNRELEASED}`) {
        if (state.previous) errors.push(`ligne ${lineNo} : « ${UNRELEASED} » doit précéder toutes les versions`);
      } else {
        checkVersionHeader(line, lineNo, state, errors);
      }
    } else if (line.startsWith('### ')) {
      state.inSection = true;
    } else if (line.startsWith('- ') && state.inRelease && !state.inSection) {
      errors.push(`ligne ${lineNo} : entrée hors d'une section « ### »`);
    }
  });

  if (!state.previous) errors.push('aucune version publiée trouvée');
  return errors;
}

function main() {
  const changelogPath = process.argv[2] || path.join(__dirname, '..', '..', 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    console.error(`CHANGELOG introuvable : ${changelogPath}`);
    process.exit(1);
  }
  const errors = validate(fs.readFileSync(changelogPath, 'utf8'));
  if (errors.length > 0) {
    console.error(`CHANGELOG non conforme (${changelogPath}) :`);
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log('CHANGELOG conforme');
}

main();
