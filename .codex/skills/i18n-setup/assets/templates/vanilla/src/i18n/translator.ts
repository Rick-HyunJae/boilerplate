import i18next from './index';

export { initI18n } from './index';

export const t = (key: string, opts?: Record<string, unknown>): string => i18next.t(key, opts) as string;

/**
 * `data-i18n="ns:key"` 속성을 가진 모든 노드의 textContent 를 번역값으로 채운다.
 * `data-i18n-attr="attrName:ns:key"` 형식이면 해당 속성을 번역값으로 설정.
 * 콤마로 구분하여 여러 속성 동시 처리 가능: `data-i18n-attr="placeholder:common:button.save,title:common:button.confirm"`.
 */
export const applyTranslations = (root: ParentNode = document) => {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = t(key);
    });

    root.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
        const spec = el.getAttribute('data-i18n-attr');
        if (!spec) return;
        spec.split(',').forEach((entry) => {
            const [attr, ...keyParts] = entry.trim().split(':');
            const key = keyParts.join(':');
            if (attr && key) el.setAttribute(attr, t(key));
        });
    });
};

export const changeLanguage = async (lng: 'ko' | 'en' | 'ja') => {
    await i18next.changeLanguage(lng);
    applyTranslations();
    listeners.forEach((fn) => fn(lng));
};

const listeners = new Set<(lng: string) => void>();
export const onLanguageChange = (fn: (lng: string) => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};
