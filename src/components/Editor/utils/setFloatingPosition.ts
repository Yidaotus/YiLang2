const VERTICAL_GAP = 0;
const HORIZONTAL_OFFSET = 0;

export function setFloatingElemPosition(
	targetRect: DOMRect | null,
	floatingElem: HTMLElement,
	anchorElem: HTMLElement,
	verticalGap: number = VERTICAL_GAP,
	horizontalOffset: number = HORIZONTAL_OFFSET,
	pos: "top" | "bottom" = "top"
): void {
	const scrollerElem = anchorElem.parentElement;

	if (targetRect === null || !scrollerElem) {
		floatingElem.style.opacity = "0";
		floatingElem.style.scale = "0";
		// So it won't be in the way (preventing clicking) of nodes below
		floatingElem.style.transform = "translate(-10000px, -10000px)";
		return;
	}

	const floatingElemRect = floatingElem.getBoundingClientRect();
	const anchorElementRect = anchorElem.getBoundingClientRect();
	const editorScrollerRect = scrollerElem.getBoundingClientRect();

	const height = targetRect.height;
	let top = targetRect.top - floatingElemRect.height - verticalGap;
	let left = targetRect.left - horizontalOffset;

	if (top < editorScrollerRect.top) {
		top += floatingElemRect.height + targetRect.height + verticalGap * 2;
	}

	if (pos === "bottom") {
		top += height;
	}

	if (left + floatingElemRect.width > editorScrollerRect.right) {
		left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset;
	}

	top -= anchorElementRect.top;
	left -= anchorElementRect.left;

	floatingElem.style.opacity = "1";
	floatingElem.style.scale = "1";
	floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}
