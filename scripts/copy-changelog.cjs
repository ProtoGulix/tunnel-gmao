// Copie CHANGELOG.md (source unique de vérité) vers public/ pour qu'il soit
// servi statiquement à /CHANGELOG.md et lisible par le backend (feature "Nouveautés").
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'CHANGELOG.md');
const dest = path.join(__dirname, '..', 'public', 'CHANGELOG.md');

fs.copyFileSync(src, dest);
