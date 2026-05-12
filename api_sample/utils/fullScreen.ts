export interface IDocumentWithFullscreen extends HTMLDocument {
	mozFullScreenElement?: Element;
	msFullscreenElement?: Element;
	webkitFullscreenElement?: Element;
	msExitFullscreen?: () => void;
	mozCancelFullScreen?: () => void;
	webkitExitFullscreen?: () => void;
}

export interface IDocumentElementWithFullscreen extends HTMLElement {
	msRequestFullscreen?: () => void;
	mozRequestFullScreen?: () => void;
	webkitRequestFullscreen?: () => void;
}

/**
 * 브라우저의 전체화면 기능을 실행하는 함수
 * @param element 전체화면의 기준이 될 Element
 */
const requestFullScreen = (element: IDocumentElementWithFullscreen) => {
	if (element.requestFullscreen) return element.requestFullscreen();
	if (element.webkitRequestFullscreen) return element.webkitRequestFullscreen();
	if (element.mozRequestFullScreen) return element.mozRequestFullScreen();
	if (element.msRequestFullscreen) return element.msRequestFullscreen();
};

/**
 * 브라우저의 전체화면 기능을 해제하는 함수
 */
const exitFullScreen = () => {
	if ((document as IDocumentWithFullscreen).exitFullscreen) return document?.exitFullscreen();
	if ((document as IDocumentWithFullscreen).msExitFullscreen) return (document as IDocumentWithFullscreen).msExitFullscreen?.();
	if ((document as IDocumentWithFullscreen).webkitExitFullscreen) return (document as IDocumentWithFullscreen).webkitExitFullscreen?.();
	if ((document as IDocumentWithFullscreen).mozCancelFullScreen) return (document as IDocumentWithFullscreen).mozCancelFullScreen?.();
};

export default {
	requestFullScreen,
	exitFullScreen
};
