# Coding Style

## Core Principles

### KISS (Keep It Simple)

- Prefer the simplest solution that actually works
- Avoid premature optimization
- Optimize for clarity over cleverness

### DRY (Don't Repeat Yourself)

- Extract repeated logic into shared functions or utilities
- Avoid copy-paste implementation drift
- Introduce abstractions when repetition is real, not speculative

### YAGNI (You Aren't Gonna Need It)

- Do not build features or abstractions before they are needed
- Avoid speculative generality
- Start simple, then refactor when the pressure is real

## File Organization

MANY SMALL FILES > FEW LARGE FILES:

- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large modules
- Organize by feature/domain, not by type

```text
src/
├── components/
│   ├── hero/
│   │   ├── Hero.tsx
│   │   ├── HeroVisual.tsx
│   │   └── hero.css
│   ├── scrolly-section/
│   │   ├── ScrollySection.tsx
│   │   ├── StickyVisual.tsx
│   │   └── scrolly.css
│   └── ui/
│       ├── Button.tsx
│       └── AnimatedText.tsx
├── hooks/
│   ├── useReducedMotion.ts
│   └── useScrollProgress.ts
├── lib/
│   └── animation.ts
└── styles/
    ├── tokens.css
    ├── typography.css
    └── global.css
```

## Naming Conventions

- Variables and functions: `camelCase` with descriptive names
- Booleans: prefer `is`, `has`, `should`, or `can` prefixes
- Interfaces, types, and components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Custom hooks: `camelCase` with a `use` prefix
- CSS classes: kebab-case or utility classes
- Animation timelines: camelCase with intent (`heroRevealTl`)

## TypeScript

### Types and Interfaces

Add parameter and return types to exported functions, shared utilities, and public class methods. Let TypeScript infer obvious local variable types. Extract repeated inline object shapes into named types or interfaces.

```typescript
// WRONG: Exported function without explicit types
export function formatUser(user) {
    return `${user.firstName} ${user.lastName}`;
}

// CORRECT: Explicit types on public APIs
interface User {
    firstName: string;
    lastName: string;
}

export function formatUser(user: User): string {
    return `${user.firstName} ${user.lastName}`;
}
```

### Interfaces vs. Type Aliases

- Use `interface` for object shapes that may be extended or implemented
- Use `type` for unions, intersections, tuples, mapped types, and utility types
- Prefer string literal unions over `enum` unless required for interoperability

```typescript
interface User {
    id: string;
    email: string;
}

type UserRole = 'admin' | 'member';
type UserWithRole = User & { role: UserRole };
```

### Avoid `any`

Use `unknown` for external or untrusted input, then narrow it safely. Use generics when a value's type depends on the caller.

```typescript
// WRONG
function getErrorMessage(error: any) {
    return error.message;
}

// CORRECT
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Unexpected error';
}
```

### React Props

Define component props with a named `interface` or `type`. Type callback props explicitly. Do not use `React.FC`.

```typescript
interface UserCardProps {
  user: User
  onSelect: (id: string) => void
}

function UserCard({ user, onSelect }: UserCardProps) {
  return <button onClick={() => onSelect(user.id)}>{user.email}</button>
}
```

## Immutability (CRITICAL)

NEVER mutate existing objects. ALWAYS create new ones:

```typescript
// WRONG: Mutation
function updateUser(user: User, name: string): User {
    user.name = name;
    return user;
}

// CORRECT: Immutability
function updateUser(user: Readonly<User>, name: string): User {
    return { ...user, name };
}
```

## Error Handling

Handle errors explicitly at every level. Never silently swallow errors.

```typescript
async function loadUser(userId: string): Promise<User> {
    try {
        return await riskyOperation(userId);
    } catch (error: unknown) {
        logger.error('Operation failed', error);
        throw new Error(getErrorMessage(error));
    }
}
```

- Provide user-friendly error messages in UI-facing code
- Log detailed error context server-side

## Input Validation

Validate at system boundaries. Use Zod for schema-based validation and infer types from the schema:

```typescript
import { z } from 'zod';

const userSchema = z.object({
    email: z.string().email(),
    age: z.number().int().min(0).max(150),
});

type UserInput = z.infer<typeof userSchema>;

const validated: UserInput = userSchema.parse(input);
```

Never trust external data (API responses, user input, file content). Fail fast with clear error messages.

## Console.log

No `console.log` statements in production code. Use proper logging libraries instead.

## Code Smells to Avoid

**Deep Nesting** — Prefer early returns over nested conditionals once the logic starts stacking.

**Magic Numbers** — Use named constants for meaningful thresholds, delays, and limits.

**Long Functions** — Split large functions into focused pieces with clear responsibilities.

## CSS

### Custom Properties

Define design tokens as variables. Do not hardcode palette, typography, or spacing repeatedly:

```css
:root {
    --color-surface: oklch(98% 0 0);
    --color-text: oklch(18% 0 0);
    --color-accent: oklch(68% 0.21 250);

    --text-base: clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
    --text-hero: clamp(3rem, 1rem + 7vw, 8rem);

    --space-section: clamp(4rem, 3rem + 5vw, 10rem);

    --duration-fast: 150ms;
    --duration-normal: 300ms;
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Animation-Only Properties

Prefer compositor-friendly motion:

- `transform`
- `opacity`
- `clip-path`
- `filter` (sparingly)

Avoid animating layout-bound properties:

- `width`, `height`, `top`, `left`, `margin`, `padding`, `border`, `font-size`

## Semantic HTML

```html
<header>
    <nav aria-label="Main navigation">...</nav>
</header>
<main>
    <section aria-labelledby="hero-heading">
        <h1 id="hero-heading">...</h1>
    </section>
</main>
<footer>...</footer>
```

Do not reach for generic wrapper `div` stacks when a semantic element exists.
