#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const scanRoots = ['packages', 'e2e-tests'].map((path) => join(root, path));
const ignoredDirectories = new Set([
  '.git',
  'node_modules',
  'dist',
  'target',
  'coverage',
  '.turbo',
  '.next',
]);
const scannedExtensions = new Set([
  '.java',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.xml',
  '.yml',
  '.yaml',
  '.sql',
]);
const bannedTokens = ['tempPassword', 'platformAdminMode', 'force_password_change'];

const findings = [];

for (const scanRoot of scanRoots) {
  if (existsDirectory(scanRoot)) {
    walk(scanRoot);
  }
}

if (findings.length > 0) {
  console.error('[banned-tokens] Forbidden platform-admin tokens found:');
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line}: ${finding.token}`);
  }
  process.exit(1);
}

console.log('[banned-tokens] OK');

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        walk(join(directory, entry.name));
      }
      continue;
    }

    if (!entry.isFile() || !shouldScan(entry.name)) {
      continue;
    }

    scanFile(join(directory, entry.name));
  }
}

function scanFile(filePath) {
  const relativePath = relative(root, filePath).replaceAll('\\', '/');
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const token of bannedTokens) {
      if (line.includes(token)) {
        findings.push({ file: relativePath, line: index + 1, token });
      }
    }
  });
}

function shouldScan(fileName) {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 && scannedExtensions.has(fileName.slice(dot));
}

function existsDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}