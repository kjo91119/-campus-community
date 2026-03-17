import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();
const targetRoots = [join(projectRoot, 'app', '(tabs)'), join(projectRoot, 'hooks')];

const forbiddenImports = ['getBoardById', 'getSchoolBoardByUniversityId', 'MOCK_MAJOR_BOARDS'];

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

  if (filePath.includes('/app/(tabs)/') && source.includes('network-home')) {
    issues.push(`network-home hardcoding in ${filePath.replace(`${projectRoot}/`, '')}`);
  }

  return issues;
}

const issues = targetRoots
  .filter((directory) => statSync(directory).isDirectory())
  .flatMap((directory) => walkDirectory(directory))
  .flatMap((filePath) => collectIssues(filePath));

if (issues.length > 0) {
  console.error('Board lookup regression check failed:\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Board lookup regression check passed.');
