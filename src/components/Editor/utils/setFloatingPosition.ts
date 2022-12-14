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
		floatingElem.style.transform = `scale(0) ${center && "translateX(-50%)"}`;
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

	console.debug({ targetRect });
	if (center) {
		left += Math.abs(targetRect.right - targetRect.left) / 2;
	}

	if (pos === "bottom") {
		top += targetRect.height;
	}

	const clipsAtTop = top < floatingElem.getBoundingClientRect().height;
	if (clipsAtTop) {
		top +=
			targetRect.height + floatingElem.getBoundingClientRect().height * 1.3;
	}

	floatingElem.style.opacity = "1";
	floatingElem.style.transform = `scale(1) ${center && "translateX(-50%)"}`;
	floatingElem.style.left = `${left}px`;
	floatingElem.style.top = `${top}px`;

	// floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}
