import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();
const targetRoots = [
  join(projectRoot, 'app'),
  join(projectRoot, 'hooks'),
  join(projectRoot, 'lib'),
];
const metadataEntryPath = join(projectRoot, 'lib', 'community', 'metadata.ts');
const mockCommunityPath = join(projectRoot, 'data', 'mock-community.ts');

const forbiddenImports = [
  'MOCK_UNIVERSITIES',
  'getUniversityById',
  'getMajorGroupById',
  'findUniversityByEmail',
];
const forbiddenMajorGroupConstantImports = ['MAJOR_GROUPS'];
const forbiddenUniversityConstantImports = ['SUPPORTED_UNIVERSITIES'];

function walkDirectory(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkDirectory(fullPath));
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function collectIssues(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const issues = [];

  const mockImportMatches = source.matchAll(
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]@\/data\/mock-community['"]/g
  );

  for (const match of mockImportMatches) {
    const importedNames = match[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.split(/\s+as\s+/)[0]?.trim());

    for (const forbiddenImport of forbiddenImports) {
      if (importedNames.includes(forbiddenImport)) {
        issues.push(`${forbiddenImport} import in ${filePath.replace(`${projectRoot}/`, '')}`);
      }
    }
  }

  if (filePath !== metadataEntryPath) {
    const majorGroupConstantMatches = source.matchAll(
      /import\s*\{([\s\S]*?)\}\s*from\s*['"]@\/constants\/major-groups['"]/g
    );

    for (const match of majorGroupConstantMatches) {
      const importedNames = match[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.split(/\s+as\s+/)[0]?.trim());

      for (const forbiddenImport of forbiddenMajorGroupConstantImports) {
        if (importedNames.includes(forbiddenImport)) {
          issues.push(`${forbiddenImport} direct import in ${filePath.replace(`${projectRoot}/`, '')}`);
        }
      }
    }

    const universityConstantMatches = source.matchAll(
      /import\s*\{([\s\S]*?)\}\s*from\s*['"]@\/constants\/universities['"]/g
    );

    for (const match of universityConstantMatches) {
      const importedNames = match[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.split(/\s+as\s+/)[0]?.trim());

      for (const forbiddenImport of forbiddenUniversityConstantImports) {
        if (importedNames.includes(forbiddenImport)) {
          issues.push(`${forbiddenImport} direct import in ${filePath.replace(`${projectRoot}/`, '')}`);
        }
      }
    }
  }

  return issues;
}

function collectGlobalIssues() {
  const issues = [];
  const metadataSource = readFileSync(metadataEntryPath, 'utf8');
  const mockCommunitySource = readFileSync(mockCommunityPath, 'utf8');

  if (metadataSource.includes("@/data/mock-community")) {
    issues.push('lib/community/metadata.ts must not depend on data/mock-community.ts');
  }

  const forbiddenHelperExports = [
    'export function findUniversityByEmail',
    'export function getUniversityById',
    'export function getMajorGroupById',
  ];

  for (const forbiddenExport of forbiddenHelperExports) {
    if (mockCommunitySource.includes(forbiddenExport)) {
      issues.push(`data/mock-community.ts should not export metadata helper: ${forbiddenExport}`);
    }
  }

  return issues;
}

const issues = targetRoots
  .filter((directory) => statSync(directory).isDirectory())
  .flatMap((directory) => walkDirectory(directory))
  .flatMap((filePath) => collectIssues(filePath))
  .concat(collectGlobalIssues());

if (issues.length > 0) {
  console.error('Community metadata lookup regression check failed:\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Community metadata lookup regression check passed.');
