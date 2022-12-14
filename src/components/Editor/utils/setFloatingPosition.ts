export function setFloatingElemPosition({
	targetRect,
	floatingElem,
	anchorElem,
	verticalOffset = 0,
	horizontalOffset = 0,
	pos = "bottom",
	center = true,
}: {
	targetRect: DOMRect | null;
	floatingElem: HTMLElement;
	anchorElem: HTMLElement;
	verticalOffset?: number;
	horizontalOffset?: number;
	pos?: "top" | "bottom";
	center?: boolean;
}): void {
	if (targetRect === null) {
		floatingElem.style.opacity = "0";
		floatingElem.style.scale = "0";
		// floatingElem.style.transform = "translate(0px, 0px)";
		return;
	}

	const anchorElementRect = anchorElem.getBoundingClientRect();

	// Top Right of target rect
	let top =
		targetRect.top -
		anchorElementRect.top +
		anchorElem.scrollTop +
		verticalOffset;
	let left = targetRect.left - anchorElementRect.left + horizontalOffset;

	// Center bottom

	if (center) {
		left += targetRect.width / 2;
		floatingElem.style.transform = "translateX(-50%)";
	}

	if (pos === "bottom") {
		top += targetRect.height;
	}

	const clipsAtTop = top < floatingElem.getBoundingClientRect().height;
	if (clipsAtTop) {
		top +=
			targetRect.height + floatingElem.getBoundingClientRect().height * 1.3;
	}

	console.debug({ top, clipsAtTop, targetRect, floatingElem, anchorElem });
	floatingElem.style.opacity = "1";
	floatingElem.style.scale = "1";
	floatingElem.style.left = `${left}px`;
	floatingElem.style.top = `${top}px`;

	// floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}
