#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, rm, stat, chmod } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const MODES = new Set(['sync', 'verify']);
const COMMAND = process.argv[2];

if (!MODES.has(COMMAND)) {
    process.stderr.write(`Usage: node scripts/agents.mjs <sync|verify>\n`);
    process.exit(1);
}

const repoRoot = resolveRepoRoot();
const sourceTargets = [
    { source: path.join(repoRoot, '.claude', 'skills'), target: path.join(repoRoot, '.agents', 'skills') },
    { source: path.join(repoRoot, '.claude', 'agents'), target: path.join(repoRoot, '.agents', 'agents') },
];
const generatedRoot = path.join(repoRoot, '.agents');

await ensureSourceTreesExist();

if (COMMAND === 'sync') {
    await syncMirror();
    process.stdout.write('✅ Synced .claude/ -> .agents/\n');
    process.exit(0);
}

await verifyMirror();
process.stdout.write('✅ .agents/ matches .claude/\n');

function resolveRepoRoot() {
    const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
    if (result.status === 0) {
        return result.stdout.trim();
    }

    return process.cwd();
}

async function ensureSourceTreesExist() {
    for (const { source } of sourceTargets) {
        await stat(source).catch(() => {
            throw new Error(`Missing source directory: ${path.relative(repoRoot, source)}`);
        });
    }
}

async function syncMirror() {
    await unlockGeneratedTree();
    await mkdir(generatedRoot, { recursive: true });
    await pruneGeneratedRoot();

    for (const { source, target } of sourceTargets) {
        await rm(target, { recursive: true, force: true });
        await mkdir(path.dirname(target), { recursive: true });
        await cp(source, target, { recursive: true, force: true, preserveTimestamps: true });
        await lockMirrorRoot(source, target);
        await lockTree(source, target);
    }

    await lockGeneratedTree();
}

async function verifyMirror() {
    await verifyGeneratedRoot();

    for (const { source, target } of sourceTargets) {
        await verifyMirrorRoot(source, target);
        const sourceManifest = await buildManifest(source);
        const targetManifest = await buildManifest(target);

        const diff = compareManifests(sourceManifest, targetManifest, source, target);
        if (diff) {
            throw new Error(diff);
        }
    }
}

async function pruneGeneratedRoot() {
    const dirEntries = await readdir(generatedRoot, { withFileTypes: true });
    for (const entry of dirEntries) {
        if (entry.name === 'skills' || entry.name === 'agents') {
            continue;
        }

        await rm(path.join(generatedRoot, entry.name), { recursive: true, force: true });
    }
}

async function lockMirrorRoot(sourceRoot, targetRoot) {
    const sourceStat = await stat(sourceRoot);
    await chmod(targetRoot, normalizeMode(sourceStat.mode)).catch(() => {});
}

async function verifyMirrorRoot(sourceRoot, targetRoot) {
    const sourceStat = await stat(sourceRoot);
    const targetStat = await stat(targetRoot).catch(() => null);

    if (!targetStat) {
        throw new Error(`Missing directory: ${path.relative(repoRoot, targetRoot)}`);
    }

    if (normalizeMode(sourceStat.mode) !== normalizeMode(targetStat.mode)) {
        throw new Error(`❌ Mirror root permission drift: ${path.relative(repoRoot, targetRoot)} should match normalized source mode`);
    }
}

async function verifyGeneratedRoot() {
    const dirEntries = await readdir(generatedRoot, { withFileTypes: true }).catch(() => null);
    if (!dirEntries) {
        throw new Error('Missing generated mirror root: .agents/');
    }

    const extraEntries = dirEntries.map((entry) => entry.name).filter((name) => name !== 'skills' && name !== 'agents');

    if (extraEntries.length > 0) {
        throw new Error(`❌ .agents/ has unexpected root entries: ${extraEntries.join(', ')}`);
    }
}

async function unlockGeneratedTree() {
    await mkdir(generatedRoot, { recursive: true });
    await setWritable(generatedRoot);
}

async function lockGeneratedTree() {
    await lockPath(generatedRoot, true);
}

async function lockTree(sourceRoot, targetRoot) {
    const entries = await listEntries(sourceRoot);
    for (const entry of entries) {
        const relative = entry.relative;
        const targetPath = path.join(targetRoot, relative);
        const mode = normalizeMode(entry.mode);
        await chmod(targetPath, mode).catch(() => {});
    }
}

async function buildManifest(root) {
    const stats = await stat(root).catch(() => null);
    if (!stats) {
        throw new Error(`Missing directory: ${path.relative(repoRoot, root)}`);
    }

    const entries = await listEntries(root);
    return entries.map((entry) => ({
        relative: entry.relative,
        kind: entry.kind,
        mode: normalizeMode(entry.mode),
        hash: entry.hash ?? null,
    }));
}

async function listEntries(root) {
    const entries = [];

    async function walk(current, relativePrefix = '') {
        const dirEntries = await readdir(current, { withFileTypes: true });
        dirEntries.sort((left, right) => left.name.localeCompare(right.name));

        for (const dirent of dirEntries) {
            const absolute = path.join(current, dirent.name);
            const relative = path.posix.join(relativePrefix, dirent.name);
            const stats = await stat(absolute);

            if (dirent.isDirectory()) {
                entries.push({
                    kind: 'dir',
                    relative,
                    mode: stats.mode,
                });
                await walk(absolute, relative);
                continue;
            }

            if (dirent.isFile()) {
                const content = await readFile(absolute);
                entries.push({
                    kind: 'file',
                    relative,
                    mode: stats.mode,
                    hash: crypto.createHash('sha256').update(content).digest('hex'),
                });
                continue;
            }

            throw new Error(`Unsupported entry type at ${path.relative(repoRoot, absolute)}`);
        }
    }

    await walk(root);
    return entries;
}

function compareManifests(sourceManifest, targetManifest, sourceRoot, targetRoot) {
    const serialize = (manifest) =>
        manifest
            .map((entry) => `${entry.kind}:${entry.relative}:${entry.mode.toString(8)}:${entry.hash ?? ''}`)
            .sort()
            .join('\n');

    const sourceSerialized = serialize(sourceManifest);
    const targetSerialized = serialize(targetManifest);

    if (sourceSerialized === targetSerialized) {
        return null;
    }

    const sourceSet = new Set(sourceManifest.map((entry) => `${entry.kind}:${entry.relative}`));
    const targetSet = new Set(targetManifest.map((entry) => `${entry.kind}:${entry.relative}`));
    const missing = [...sourceSet].filter((item) => !targetSet.has(item));
    const extra = [...targetSet].filter((item) => !sourceSet.has(item));
    const mismatched = sourceManifest
        .filter((entry) => entry.kind === 'file')
        .filter((entry) => {
            const targetEntry = targetManifest.find((candidate) => candidate.relative === entry.relative && candidate.kind === entry.kind);
            return targetEntry && (targetEntry.hash !== entry.hash || targetEntry.mode !== entry.mode);
        })
        .map((entry) => entry.relative);

    const problems = [];
    if (missing.length > 0) {
        problems.push(`missing: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
        problems.push(`extra: ${extra.join(', ')}`);
    }
    if (mismatched.length > 0) {
        problems.push(`content/mode mismatch: ${mismatched.join(', ')}`);
    }

    return [
        '❌ .agents/ is out of sync with .claude/',
        `   source: ${path.relative(repoRoot, sourceRoot)}`,
        `   target: ${path.relative(repoRoot, targetRoot)}`,
        `   ${problems.join(' | ')}`,
        '   Run `pnpm sync:agents` to regenerate the mirror.',
    ].join('\n');
}

function normalizeMode(mode) {
    return mode & ~fsConstants.S_IWUSR & ~fsConstants.S_IWGRP & ~fsConstants.S_IWOTH;
}

async function lockPath(target, isDirectory) {
    const stats = await stat(target).catch(() => null);
    if (!stats) {
        return;
    }

    const mode = normalizeMode(stats.mode);
    await chmod(target, isDirectory ? mode | fsConstants.S_IXUSR | fsConstants.S_IXGRP | fsConstants.S_IXOTH : mode).catch(() => {});
}

async function setWritable(target) {
    const stats = await stat(target).catch(() => null);
    if (!stats) {
        return;
    }

    if (stats.isDirectory()) {
        await chmod(target, 0o755).catch(() => {});
        const entries = await readdir(target, { withFileTypes: true }).catch(() => []);
        for (const entry of entries) {
            await setWritable(path.join(target, entry.name));
        }
        return;
    }

    await chmod(target, 0o644).catch(() => {});
}
