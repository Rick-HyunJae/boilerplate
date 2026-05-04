import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app';

// ─────────────────────────────────────────────────────────────────
// 스타일 시스템 선택 — 하나만 활성화하세요
// 동시 활성화 시 CSS reset 충돌 (Tailwind preflight vs _reset.scss)
// ─────────────────────────────────────────────────────────────────

// [옵션 A] Tailwind CSS v4 (기본값)
import '@/shared/styles/index.css';

// [옵션 B] SCSS (Dart Sass)
// import '@/shared/styles/global.scss';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
