interface TCopyOptions {
	plainText: string;
	htmlText?: string;
	onSuccess?: () => void;
	onError?: (error: unknown) => void;
}

/**
 * 텍스트와 HTML을 클립보드에 복사하는 유틸 함수.
 * - ClipboardItem이 지원되면 해당 방식 사용
 * - WebView/IE 환경은 execCommand + fallback 사용
 */
export async function copyToClipboard(options: TCopyOptions): Promise<void> {
	const { plainText, htmlText, onSuccess, onError } = options;

	const isClipboardItemSupported = (): boolean => typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function';

	const fallbackCopy = () => {
		try {
			const span = document.createElement('span');
			span.innerHTML = htmlText || plainText;

			Object.assign(span.style, {
				all: 'unset',
				position: 'fixed',
				top: '0',
				clip: 'rect(0,0,0,0)',
				whiteSpace: 'pre',
				userSelect: 'text',
				WebkitUserSelect: 'text',
				MozUserSelect: 'text',
				msUserSelect: 'text'
			});

			span.addEventListener('copy', (event: ClipboardEvent) => {
				event.preventDefault();
				event.clipboardData?.setData('text/plain', plainText);

				if (htmlText) {
					event.clipboardData?.setData('text/html', htmlText);
				}
			});

			document.body.appendChild(span);

			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(span);
			selection?.removeAllRanges();
			selection?.addRange(range);

			const success = document.execCommand('copy');
			if (!success) throw new Error('execCommand copy failed');

			document.body.removeChild(span);
			selection?.removeAllRanges();

			onSuccess?.();
		} catch (error) {
			onError?.(error);
		}
	};

	try {
		if (isClipboardItemSupported()) {
			const clipboardItems: Record<string, Blob> = { 'text/plain': new Blob([plainText], { type: 'text/plain' }) };

			if (htmlText) {
				clipboardItems['text/html'] = new Blob([htmlText], { type: 'text/html' });
			}

			const item = new ClipboardItem(clipboardItems);
			await navigator.clipboard.write([item]);

			onSuccess?.();
		} else {
			fallbackCopy();
		}
	} catch {
		fallbackCopy();
	}
}
