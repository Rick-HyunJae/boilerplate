/**
 * 이미지 다운로드 시, 데이터 URL 생성
 */
const createDataUrlForImage = (image: HTMLCanvasElement) => image.toDataURL('image/png').replace('image/png', 'image/octet-stream');

/**
 * 파일 다운로드 시, Blob 생성
 */
const createBlobForFile = (xhr: XMLHttpRequest) => new Blob([xhr.response], { type: xhr.getResponseHeader('Content-Type') || 'text/html' });

/**
 * 다운로드 anchor 생성
 */
const createAnchorAndDownload = (fileUrl: string, fileName?: string) => {
	const anchor = document.createElement('a');

	anchor.style.cssText = 'display: none';
	anchor.href = fileUrl;
	anchor.target = '_blank';
	anchor.rel = 'noopener noreferrer';
	fileName && (anchor.download = fileName);

	anchor.click();
	anchor.remove();
};

export default {
	createDataUrlForImage,
	createBlobForFile,
	createAnchorAndDownload
};
