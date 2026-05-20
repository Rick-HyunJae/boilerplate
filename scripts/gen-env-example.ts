import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { envSchema } from '../config/env/index.ts';

// Relies on zod v4 internal ._def shape — revisit if upgrading zod major version
interface ZodFieldDef {
    type: string;
    checks?: Array<{ format?: string }>;
    entries?: Record<string, string>;
    defaultValue?: string;
    innerType?: { _def?: ZodFieldDef };
}

interface ZodField {
    _def: ZodFieldDef;
}

function resolveInnerDef(def: ZodFieldDef): ZodFieldDef {
    if (def.type === 'default' && def.innerType?._def) {
        return def.innerType._def;
    }
    return def;
}

function buildComment(key: string, def: ZodFieldDef): string {
    const inner = resolveInnerDef(def);

    if (inner.type === 'enum') {
        const options = Object.keys(inner.entries ?? {}).join(' | ');
        return `# ${key} (enum: ${options})`;
    }

    if (inner.type === 'string') {
        const urlCheck = inner.checks?.find((c) => c.format === 'url');
        if (urlCheck) {
            return `# ${key} (string, URL format)`;
        }
        return `# ${key} (string)`;
    }

    return `# ${key}`;
}

function buildPlaceholder(key: string, def: ZodFieldDef): string {
    if (def.type === 'default') {
        return String(def.defaultValue ?? '');
    }

    const inner = resolveInnerDef(def);

    if (inner.type === 'enum') {
        const firstOption = Object.keys(inner.entries ?? {})[0] ?? '';
        return firstOption;
    }

    // Update this map when new non-default string fields are added to envSchema
    const placeholders: Record<string, string> = {
        VITE_API_BASE_URL: 'https://example.com/api',
        VITE_APP_TITLE: 'My App',
    };
    return placeholders[key] ?? '';
}

function generateEnvExample(): void {
    const shape = envSchema.shape as Record<string, ZodField>;
    const lines: string[] = [];

    for (const [key, field] of Object.entries(shape)) {
        const def = field._def;
        lines.push(buildComment(key, def));
        lines.push(`${key}=${buildPlaceholder(key, def)}`);
    }

    const content = lines.join('\n') + '\n';
    const outputPath = resolve(import.meta.dirname, '../config/env/.env.example');
    writeFileSync(outputPath, content, 'utf-8');
    process.stdout.write(`Generated: ${outputPath}\n`);
}

generateEnvExample();
