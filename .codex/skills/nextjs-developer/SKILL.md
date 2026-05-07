---
name: nextjs-developer
description: Next.js 16 App Router development guide with latest patterns (params Promise, PageProps helpers, useActionState, Server Components, Cache Components, Proxy). Use when creating pages, layouts, routes, Server Actions, or working with Next.js 16 projects.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Next.js 16 Quick Reference

**Version:** 16.1.1 (Jan 2025)  
**Doc Source:** Official Next.js documentation

---

## 🚨 CRITICAL RULES (Always Enforce)

### 1. params are Promise

```typescript
// ❌ WRONG
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>
}

// ✅ CORRECT
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  return <h1>{slug}</h1>
}
```

### 2. Use useActionState (NOT useFormState)

```typescript
// ❌ DEPRECATED
import { useFormState } from 'react-dom';

// ✅ CORRECT
import { useActionState } from 'react';
```

### 3. Form Actions Return Void

```typescript
// ❌ WRONG - Form actions can't return data
export async function submitForm(formData: FormData) {
    'use server';
    return { success: true }; // Type error!
}

// ✅ CORRECT - Use revalidation
export async function submitForm(formData: FormData) {
    'use server';
    await saveData(formData);
    revalidatePath('/posts');
    // No return
}
```

### 4. NO `any` Types

```typescript
// ❌ WRONG
const data: any = await fetch(...)

// ✅ CORRECT
const data: Post[] = await fetch(...).then(r => r.json())
```

### 5. Use PageProps/LayoutProps Helpers

```typescript
// ✅ Type-safe with auto-completion
export default async function Page(props: PageProps<'/blog/[slug]'>) {
    const { slug } = await props.params;
}
```

### 6. Use 'use cache' for Cached Dynamic Content

```typescript
// ❌ WRONG - Dynamic data without caching
export default async function Page() {
  const posts = await db.posts.findMany() // Fetched on every request
  return <PostList posts={posts} />
}

// ✅ CORRECT - Cache with 'use cache'
'use cache'
import { cacheLife } from 'next/cache'

export default async function Page() {
  cacheLife('hours') // Cache for 1 hour
  const posts = await db.posts.findMany()
  return <PostList posts={posts} />
}
```

---

## ⚡ Essential Patterns

### Static Page

```typescript
// app/about/page.tsx
export default function Page() {
  return <h1>About</h1>
}

export const metadata = {
  title: 'About',
  description: 'About page'
}
```

### Dynamic Page

```typescript
// app/blog/[slug]/page.tsx
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const post = await getPost(slug)
  return <article><h1>{post.title}</h1></article>
}

export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map(p => ({ slug: p.slug }))
}
```

### Root Layout

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav>{/* Nav */}</nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
```

### Server Action (Form - Void Return)

```typescript
// app/actions.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  await db.posts.create({ data: { title } })
  revalidatePath('/posts')
}

// app/posts/new/page.tsx
import { createPost } from '@/app/actions'

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Server Action (With State - Returns Data)

```typescript
// app/actions.ts
'use server'

export async function updateProfile(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  if (!name) return { error: 'Name required' }
  await db.users.update({ name })
  return { success: true }
}

// app/profile/page.tsx
'use client'
import { useActionState } from 'react'
import { updateProfile } from '@/app/actions'

export default function Profile() {
  const [state, action, isPending] = useActionState(updateProfile, null)

  return (
    <form action={action}>
      <input name="name" required />
      <button disabled={isPending}>Save</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}
```

### Client Component

```typescript
// app/components/counter.tsx
'use client'
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicks: {count}
    </button>
  )
}
```

### Cache Components (PPR)

```typescript
// app/page.tsx
import { Suspense } from 'react'
import { cacheLife, cacheTag } from 'next/cache'

// Static shell - prerendered at build
export default function Page() {
  return (
    <>
      <header><h1>My Blog</h1></header>
      {/* Cached dynamic - included in static shell */}
      <BlogPosts />
      {/* Runtime dynamic - streams at request */}
      <Suspense fallback={<div>Loading...</div>}>
        <UserPreferences />
      </Suspense>
    </>
  )
}

// Cached component - everyone sees same data
async function BlogPosts() {
  'use cache'
  cacheLife('hours')
  cacheTag('posts')

  const posts = await db.posts.findMany()
  return <PostList posts={posts} />
}

// Runtime component - personalized per user
async function UserPreferences() {
  const session = (await cookies()).get('session')
  return <div>Welcome {session.user}</div>
}
```
