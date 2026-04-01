#!/usr/bin/env node
/**
 * Compute Next Version and Update Files
 *
 * Analyzes conventional commits since last tag to determine the next version bump.
 * Updates VERSION file, syncs version across all platforms, and updates CHANGELOG.md.
 *
 * This script only handles version computation and file updates.
 * Branch creation, committing, pushing, and PR creation are handled by
 * peter-evans/create-pull-request in the workflow.
 *
 * Outputs (via GITHUB_OUTPUT):
 *   - next_version: the computed next version string
 *   - bump_type: major | minor | patch
 *   - pr_title: the PR title to use
 *   - pr_body_file: path to a temp file containing the PR body
 *
 * Usage: node scripts/ci/compute-next-version.mjs [--dry-run]
 */

import { execSync, execFileSync } from 'child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  calculateNextVersion,
  determineBumpType,
  generateChangelogEntry,
} from './version-bump.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

// Configuration
const CONFIG = {
  changelogFile: join(projectRoot, 'CHANGELOG.md'),
  packageFile: join(projectRoot, 'package.json'),
  versionFile: join(projectRoot, 'VERSION'),
  syncScript: join(projectRoot, 'scripts', 'sync-version.mjs'),
  prTitlePrefix: 'chore(release): version',
};

/**
 * Get commits since last tag
 */
function getCommitsSinceLastTag() {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      cwd: projectRoot,
    }).trim();

    const commits = execSync(`git log ${lastTag}..HEAD --oneline --no-merges`, {
      encoding: 'utf8',
      cwd: projectRoot,
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter((commit) => !commit.includes('chore(release):')); // Exclude release commits

    return { lastTag, commits };
  } catch {
    // No tags found, get all commits
    const commits = execSync('git log --oneline --no-merges', {
      encoding: 'utf8',
      cwd: projectRoot,
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter((commit) => !commit.includes('chore(release):')); // Exclude release commits

    return { lastTag: null, commits };
  }
}

/**
 * Generate PR description
 */
function generatePRDescription(commits, version, bumpType, lastTag) {
  const commitCount = commits.length;
  const sinceText = lastTag ? `since ${lastTag}` : 'from the beginning';

  let description = `## Version Bump: ${version}\n\n`;
  description += `This PR automatically bumps the version based on ${commitCount} conventional commits ${sinceText}.\n\n`;

  description += `### Analysis\n\n`;
  description += `- **Bump Type**: ${bumpType}\n`;
  description += `- **Commits Analyzed**: ${commitCount}\n`;
  description += `- **Last Tag**: ${lastTag || 'None (first release)'}\n\n`;

  description += `### Changes\n\n`;
  description += `- Updated \`VERSION\` file to \`${version}\`\n`;
  description += `- Synced version across all platforms:\n`;
  description += `  - npm: \`package.json\`\n`;
  description += `  - Python: \`python/pyproject.toml\`\n`;
  description += `  - Ruby: \`lib/turbo-themes/version.rb\`\n`;
  description += `  - Swift: \`swift/Sources/TurboThemes/Version.swift\`\n`;
  description += `- Updated \`CHANGELOG.md\` with new version entry\n\n`;

  description += `### Next Steps\n\n`;
  description += `After this PR is merged:\n`;
  description += `1. A new tag \`v${version}\` will be created\n`;
  description += `2. Publishing workflows will trigger:\n`;
  description += `   - \`publish-npm.yml\` -> npmjs.org\n`;
  description += `   - \`publish-python.yml\` -> PyPI\n`;
  description += `   - \`publish-gem.yml\` -> RubyGems\n`;
  description += `3. \`release-publish-pr.yml\` will create GitHub release with SBOM\n\n`;

  description += `### Commits Included\n\n`;
  description += `\`\`\`\n`;
  commits.slice(0, 10).forEach((commit) => {
    description += `${commit}\n`;
  });
  if (commits.length > 10) {
    description += `... and ${commits.length - 10} more commits\n`;
  }
  description += `\`\`\`\n\n`;

  description += `---\n\n`;
  description += `*This PR was created automatically by the version bump workflow.*`;

  return description;
}

/**
 * Write a value to GITHUB_OUTPUT
 */
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `${name}=${value}\n`);
  }
  console.log(`  ${name}=${value}`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log('Computing next version and updating files\n');

  // Get commits since last tag
  const { lastTag, commits } = getCommitsSinceLastTag();
  console.log(`Analyzing ${commits.length} commits since ${lastTag || 'beginning'}`);

  if (commits.length === 0) {
    console.log('No commits to analyze, no version bump needed');
    setOutput('bump_needed', 'false');
    return;
  }

  // Determine bump type
  const bumpType = determineBumpType(commits);
  console.log(`Bump type: ${bumpType || 'none'}`);

  if (!bumpType) {
    console.log('No version bump needed based on conventional commits');
    setOutput('bump_needed', 'false');
    return;
  }

  // Calculate next version from VERSION file (source of truth)
  const currentVersion = readFileSync(CONFIG.versionFile, 'utf8').trim();
  const nextVersion = calculateNextVersion(currentVersion, bumpType);

  console.log(`Version bump: ${currentVersion} -> ${nextVersion}`);

  if (isDryRun) {
    console.log('\nDry run - no changes made');
    setOutput('bump_needed', 'true');
    setOutput('next_version', nextVersion);
    setOutput('bump_type', bumpType);
    return;
  }

  // Update VERSION file (source of truth for all platforms)
  writeFileSync(CONFIG.versionFile, `${nextVersion}\n`);
  console.log(`Updated VERSION file to ${nextVersion}`);

  // Run sync-version.mjs to update all platform packages
  // This syncs: package.json, Python, Ruby, Swift
  execFileSync('node', [CONFIG.syncScript], { cwd: projectRoot, stdio: 'inherit' });
  console.log(`Synced version across all platforms`);

  // Update CHANGELOG.md
  const changelogEntry = generateChangelogEntry(commits, nextVersion, bumpType);
  const changelogContent = readFileSync(CONFIG.changelogFile, 'utf8');
  const updatedContent = changelogContent.replace(
    /## \[Unreleased\][\s\S]*?(?=## \[|$)/,
    `## [Unreleased]\n\n### Added\n\n- TBD\n\n${changelogEntry}`
  );
  writeFileSync(CONFIG.changelogFile, updatedContent);
  console.log(`Updated CHANGELOG.md`);

  // Generate PR description and write to temp file outside repo
  const description = generatePRDescription(commits, nextVersion, bumpType, lastTag);
  const tmpDir = process.env.RUNNER_TEMP || '/tmp';
  const prBodyFile = join(tmpDir, 'version-pr-body.md');
  writeFileSync(prBodyFile, description, 'utf8');

  // Set outputs for the workflow
  setOutput('bump_needed', 'true');
  setOutput('next_version', nextVersion);
  setOutput('bump_type', bumpType);
  setOutput('pr_title', `${CONFIG.prTitlePrefix} ${nextVersion}`);
  setOutput('pr_body_file', prBodyFile);

  console.log(`\nVersion computation and file updates complete!`);
  console.log(`New version: ${nextVersion}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
