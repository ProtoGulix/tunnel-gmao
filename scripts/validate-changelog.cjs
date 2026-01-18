#!/usr/bin/env node

/**
 * Validation automatique des changelogs
 * 
 * Bloque les commits si le changelog PATCH ne respecte pas les règles :
 * - Max 1 bullet point en "Impact fonctionnel"
 * - Pas de section "Stabilisation / Dette technique"
 * - Pas de jargon technique (hook, callback, optimiste, etc.)
 * - Longueur raisonnable (< 100 caractères)
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour terminaux
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  const changelogPath = process.argv[2] || path.join(__dirname, '..', 'docs', 'CHANGELOG.md');

  if (!fs.existsSync(changelogPath)) {
    log('red', '❌ CHANGELOG.md introuvable');
    process.exit(1);
  }

  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const lines = changelog.split('\n');

  // Extraire la dernière version
  const versionMatch = changelog.match(/^## (\d+\.\d+\.\d+) - /m);
  if (!versionMatch) {
    log('red', '❌ Aucune version trouvée dans CHANGELOG.md');
    process.exit(1);
  }

  const version = versionMatch[1];
  const versionParts = version.split('.').map(Number);
  const isPatch = versionParts[2] !== 0; // Z !== 0 = PATCH

  if (!isPatch) {
    log('green', `✅ MINOR/MAJOR ${version} (contrôle allégé)`);
    process.exit(0);
  }

  // ===== VALIDATION PATCH =====
  log('yellow', `🔍 Validation PATCH ${version}...`);

  // Extraire la section de cette version
  const versionSectionMatch = changelog.match(
    new RegExp(`## ${version.replace(/\./g, '\\.')}[\\s\\S]*?(?=## \\d|$)`)
  );

  if (!versionSectionMatch) {
    log('red', `❌ Section pour ${version} introuvable`);
    process.exit(1);
  }

  const versionSection = versionSectionMatch[0];

  // 1. Vérifier section "Impact fonctionnel"
  const impactMatch = versionSection.match(/### 🎯 Impact fonctionnel[\s\n]+([\s\S]*?)(?=###|$)/);
  if (!impactMatch) {
    log('red', '❌ PATCH: Section "Impact fonctionnel" manquante');
    process.exit(1);
  }

  const impactContent = impactMatch[1].trim();

  // 2. Compter les bullet points
  const bullets = (impactContent.match(/^- /gm) || []).length;
  if (bullets === 0) {
    log('red', '❌ PATCH: Aucun bullet point en "Impact fonctionnel"');
    process.exit(1);
  }
  if (bullets > 1) {
    log('red', `❌ PATCH: Max 1 bullet en "Impact fonctionnel" (trouvé: ${bullets})`);
    log('yellow', '💡 Si plusieurs changements → créer un MINOR (X.Y.0)');
    process.exit(1);
  }

  // 3. Vérifier longueur du bullet (max ~100 caractères)
  const bulletText = impactContent.replace(/^- /, '').trim();
  if (bulletText.length > 120) {
    log('red', `❌ PATCH: Bullet trop long (${bulletText.length} caractères, max 100)`);
    log('yellow', `💡 Texte actuel: "${bulletText}"`);
    log('yellow', '💡 Simplifier la phrase pour qu\'elle soit claire et concise');
    process.exit(1);
  }

  // 4. Détecter jargon technique
  const bannedWords = [
    'hook',
    'callback',
    'optimiste',
    'optimistic',
    'synchronisation',
    'refactor',
    'useOptimistic',
    'useState',
    'useEffect',
    'component',
    'composant technique',
    'architecture',
    'invalidate',
    'mutation',
    'state',
    'props',
  ];

  const lowerBullet = bulletText.toLowerCase();
  const foundBanned = bannedWords.filter((word) => lowerBullet.includes(word));

  if (foundBanned.length > 0) {
    log('red', `❌ PATCH: Jargon technique détecté: ${foundBanned.join(', ')}`);
    log('yellow', '💡 Utiliser vocabulaire utilisateur : affichage, création, modification, correction');
    process.exit(1);
  }

  // 5. Vérifier absence de "Stabilisation / Dette technique"
  if (versionSection.includes('### 🧱 Stabilisation')) {
    log('red', '❌ PATCH: Ne doit pas avoir "Stabilisation / Dette technique"');
    log('yellow', '💡 Cette section est réservée aux MINOR/MAJOR');
    process.exit(1);
  }

  // 6. Vérifier nombre de composants (≤ 2)
  const componentsMatch = versionSection.match(/### 🧩 Composants[\s\S]*?\n([\s\S]*?)(?=###|$)/);
  if (componentsMatch) {
    const componentsList = componentsMatch[1];
    const componentsCount = (componentsList.match(/^- /gm) || []).length;
    if (componentsCount > 2) {
      log('red', `❌ PATCH: Trop de composants listés (${componentsCount}, max 2)`);
      log('yellow', '💡 Si changements sur > 2 fichiers → créer un MINOR');
      process.exit(1);
    }
  }

  // ===== SUCCÈS =====
  log('green', `✅ PATCH ${version} conforme aux conventions`);
  log('green', `   → "${bulletText}"`);
  process.exit(0);
}

main();
