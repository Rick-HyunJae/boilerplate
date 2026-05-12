---
name: react-router-v7
description: React Router 7 declarative (library) mode for CSR apps - createBrowserRouter, RouterProvider, nested routes, Outlet, navigation hooks, code splitting with React.lazy, useSearchParams for URL state. Use when configuring routes, navigating between pages, protecting routes, or managing URL-driven state.
license: MIT
---

# React Router 7 — Declarative Mode (CSR)

이 프로젝트는 React Router 7을 **declarative/library mode**로 사용한다.
`createBrowserRouter` + `RouterProvider` 기반 CSR 앱이다.

> 페이지 컴포넌트 배치와 슬라이스 규칙은 `fsd-development` 스킬을 따른다.

---

## Router Setup

```typescript
// src/app/routes/index.tsx
import { createBrowserRouter } from 'react-router';
import { HomePage } from '@/pages/home';
import { NotFoundPage } from '@/pages/not-found';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
```

```typescript
// src/app/index.tsx
import { RouterProvider } from 'react-router';
import { router } from './routes';

export function App() {
  return <RouterProvider router={router} />;
}
```

---

## Route Configuration

### Flat Routes

```typescript
createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/products', element: <ProductListPage /> },
  { path: '/products/:id', element: <ProductDetailPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
```

### Nested Routes with Outlet

```typescript
import { Outlet } from 'react-router';

// Layout component
function DashboardLayout() {
  return (
    <div>
      <DashboardNav />
      <Outlet /> {/* child routes render here */}
    </div>
  );
}

createBrowserRouter([
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHomePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);
```

### Route Protection

```typescript
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Usage in route config
{ path: '/dashboard', element: <RequireAuth><DashboardLayout /></RequireAuth> }
```

---

## Code Splitting (React.lazy + Suspense)

FSD `pages/` 슬라이스 단위로 lazy loading을 적용한다.

```typescript
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';

const ProductListPage = lazy(() =>
  import('@/pages/product-list').then((m) => ({ default: m.ProductListPage }))
);
const ProductDetailPage = lazy(() =>
  import('@/pages/product-detail').then((m) => ({ default: m.ProductDetailPage }))
);

function PageLoader() {
  return <div>Loading...</div>;
}

createBrowserRouter([
  {
    path: '/products',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProductListPage />
      </Suspense>
    ),
  },
  {
    path: '/products/:id',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProductDetailPage />
      </Suspense>
    ),
  },
]);
```

---

## Navigation Hooks

### useNavigate

```typescript
import { useNavigate } from 'react-router';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### useParams

```typescript
import { useParams } from 'react-router';

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product } = useProductQuery(id!);

  return <div>{product?.name}</div>;
}
```

### useLocation

```typescript
import { useLocation } from 'react-router';

function LoginPage() {
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  const handleLogin = async () => {
    await login();
    navigate(from, { replace: true });
  };
}
```

---

## URL as State (useSearchParams)

필터, 정렬, 페이지네이션 등 공유 가능한 UI 상태는 URL search params에 저장한다.

```typescript
import { useSearchParams } from 'react-router';

function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? 'all';
  const page = Number(searchParams.get('page') ?? '1');

  const handleCategoryChange = (newCategory: string) => {
    setSearchParams((prev) => {
      prev.set('category', newCategory);
      prev.set('page', '1'); // 필터 변경 시 페이지 리셋
      return prev;
    });
  };

  return (
    <div>
      <CategoryFilter value={category} onChange={handleCategoryChange} />
      <ProductGrid category={category} page={page} />
    </div>
  );
}
```

---

## Link and NavLink

```typescript
import { Link, NavLink } from 'react-router';

// 기본 링크
<Link to="/products">Products</Link>

// 현재 경로 active 스타일
<NavLink
  to="/dashboard"
  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
>
  Dashboard
</NavLink>
```

---

## Error Handling

```typescript
function RouteErrorBoundary() {
  return (
    <div>
      <h1>페이지를 찾을 수 없습니다</h1>
      <Link to="/">홈으로</Link>
    </div>
  );
}

createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
]);
```

---

## Checklist

구현 완료 전 확인 사항:

- [ ] 페이지 컴포넌트는 FSD `pages/` 레이어에 위치
- [ ] 공유 가능한 UI 상태(필터, 정렬, 탭)는 `useSearchParams`로 URL에 저장
- [ ] 코드 스플리팅: 페이지별 `React.lazy` + `Suspense` 적용
- [ ] 중첩 라우트는 `Outlet` 사용
- [ ] 보호된 라우트는 wrapper 컴포넌트로 처리 (전역 미들웨어 아님)
- [ ] `useNavigate`는 사용자 액션 직후에만 사용 (렌더 중 호출 금지)
- [ ] `Link`/`NavLink` 사용 시 `<a>` 직접 사용 금지

## Key APIs

| API | 용도 |
|-----|------|
| `createBrowserRouter` | 라우트 구성 |
| `RouterProvider` | 앱 진입점에서 router 주입 |
| `Outlet` | 중첩 라우트 렌더링 위치 |
| `Link` / `NavLink` | 선언적 네비게이션 |
| `useNavigate` | 프로그래밍적 네비게이션 |
| `useParams` | URL 파라미터 접근 |
| `useSearchParams` | URL search params 읽기/쓰기 |
| `useLocation` | 현재 location 객체 |
| `Navigate` | 렌더 중 리다이렉트 |
