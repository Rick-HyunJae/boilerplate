import { useTranslation, UseTranslationOptions } from 'react-i18next';

import { resources } from '~language/i18n';

type Namespace = keyof (typeof resources)['ko'];

/**
 * `useTranslation`의 `t` 함수가 모든 문자열을 받도록 타입을 완화한 래퍼(wrapper) 훅.
 *
 * Snackbar 같이 동적인 문자열을 번역해야 하는 특수 컴포넌트용.
 * `as any` 캐스팅을 훅 내부에 캡슐화하여, 사용처에서 타입 에러 없이 `t(message)` 호출 가능.
 *
 * 정적 키에는 표준 `useTranslation` 을 사용. (자동완성·타입체크 보존)
 */
const useLooseTranslation = (
	ns?: Namespace | Namespace[] | readonly Namespace[],
	options?: UseTranslationOptions
) => {
	const { t, ...rest } = useTranslation(ns, options);

	type StrictT = typeof t;
	type LooseT = StrictT & ((key: string, opts?: unknown) => string);
	const runtimeT = t as unknown as (key: string, opts?: unknown) => string;
	const looseT = ((key: string, opts?: unknown) => runtimeT(key, opts)) as LooseT;

	return { looseT, t, ...rest };
};

export { useLooseTranslation };
