#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { convertHtml } from './convert.js';
import { writeAssets } from './assets.js';

function parseArgs(argv) {
  const positional = [];
  let assetsBase = '';
  for (const arg of argv) {
    const m = /^--assets-base=(.*)$/.exec(arg);
    if (m) assetsBase = m[1];
    else positional.push(arg);
  }
  return { inputPath: positional[0], outputPath: positional[1], assetsBase };
}

function main() {
  const { inputPath, outputPath, assetsBase } = parseArgs(process.argv.slice(2));
  if (!inputPath) {
    console.error('Usage: node src/cli.js <input.html> [output.json] [--assets-base=https://example.com/wp-content/uploads/page]');
    process.exit(1);
  }

  const html = fs.readFileSync(inputPath, 'utf-8');
  const title = path.basename(inputPath, path.extname(inputPath));
  const { template, report, assets, stats } = convertHtml(html, { assetsBase, title });

  const out = outputPath || path.join(path.dirname(inputPath), `${title}.elementor.json`);
  fs.writeFileSync(out, JSON.stringify(template, null, 2), 'utf-8');

  const reportPath = out.replace(/\.json$/, '') + '.style-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  const assetsDir = writeAssets(assets, path.dirname(out));

  console.log(`Écrit : ${out}`);
  const bp = stats.breakpointRuleCount;
  console.log(
    `Règles CSS chargées : ${stats.ruleCount} (base), ${bp.tablet} max-width tablet + ${bp.mobile} max-width mobile + ${bp.minWidth || 0} min-width`,
  );
  console.log(`Éléments avec style appliqué : ${stats.styledElements}`);
  console.log(`Valeurs rejetées à la validation : ${stats.rejected}`);
  console.log(`Trous non convertis (fallback ${stats.fallbackEnabled ? 'actif' : 'inactif'}) : ${stats.holes} (voir ${path.basename(reportPath)})`);
  if (stats.assetCount > 0) {
    const totalKb = Math.round(assets.reduce((s, a) => s + a.bytes, 0) / 1024);
    console.log(`Images base64 extraites : ${stats.assetCount} fichiers (${totalKb} Ko) -> ${assetsDir}`);
    if (assetsBase) {
      console.log(`URLs réécrites vers : ${assetsBase}`);
    } else {
      console.log('⚠ URLs laissées en base64 (Elementor les remplacera par un placeholder à l\'import).');
      console.log('  → Hébergez le dossier assets/ puis relancez avec --assets-base=<URL publique du dossier>.');
    }
  }
}

main();
