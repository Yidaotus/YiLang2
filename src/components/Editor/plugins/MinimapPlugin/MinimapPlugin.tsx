import type { LexicalNode } from "lexical";

import { Box, useToken } from "@chakra-ui/react";
import { $isImageNode } from "@components/Editor/nodes/ImageNode";
import { $isSplitLayoutColumnNode } from "@components/Editor/nodes/SplitLayout/SplitLayoutColumn";
import { $isSplitLayoutContainerNode } from "@components/Editor/nodes/SplitLayout/SplitLayoutContainer";
import { $isListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { mergeRegister } from "@lexical/utils";
import {
	$getNearestRootOrShadowRoot,
	$getRoot,
	$getSelection,
	$isParagraphNode,
	$isRootNode,
	COMMAND_PRIORITY_NORMAL,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { $isRemarkContainerNode } from "../RemarkBlockPlugin/RemarkContainerNode";
import { $isRemarkContentNode } from "../RemarkBlockPlugin/RemarkContentNode";

const LINE_PADDING = 3;
const LINE_HEIGHT = 3;
const CANVAS_WIDTH = 90;
const LAYOUT_PADDING = 5;
const BLOCK_PADDING = 1;

const outlineNodes = (
	nodes: Array<LexicalNode>,
	ctx: CanvasRenderingContext2D,
	brandColor: string,
	startOffsetX: number,
	startOffsetY: number,
	canvasWidth: number
) => {
	const selection = $getSelection();
	const selectedKeys: Array<string> = [];
	if (selection) {
		const selectedNodes = selection.getNodes();
		for (const selectionNode of selectedNodes) {
			if ($isRootNode(selectionNode)) continue;

			let parentNode = selectionNode.getParent();
			let currentNode = selectionNode;
			const rootNode = $getNearestRootOrShadowRoot(currentNode);

			while (parentNode && parentNode !== rootNode) {
				currentNode = parentNode;
				parentNode = parentNode.getParent();
			}
			if ($isRemarkContentNode(rootNode)) {
				const remarkParent = rootNode.getParent();
				if (remarkParent) {
					selectedKeys.push(remarkParent.getKey());
				}
			}
			selectedKeys.push(currentNode.getKey());
		}
	}

	const x = startOffsetX;
	let y = startOffsetY;

	const currentCtxStrokeStyle = ctx.strokeStyle;
	const currentCtxFillStyle = ctx.fillStyle;

	for (const node of nodes) {
		if (selectedKeys.includes(node.getKey())) {
			ctx.fillStyle = brandColor;
			ctx.strokeStyle = brandColor;
		} else {
			ctx.fillStyle = "#A9AfC0";
			ctx.strokeStyle = "#A9AfC0";
		}
		if ($isParagraphNode(node)) {
			const linesToDraw = Math.ceil(node.getTextContentSize() / 50);

			for (let i = 0; i < linesToDraw; i++) {
				const lineWidth = i + 1 >= linesToDraw ? canvasWidth - 10 : canvasWidth;
				ctx.fillRect(x, y, lineWidth, LINE_HEIGHT);
				y += LINE_HEIGHT + LINE_PADDING;
			}
		} else if ($isImageNode(node)) {
			const containerHeight = 20;
			const containerWidth = canvasWidth;
			const containerPadding = 0;

			ctx.strokeRect(
				x + containerPadding,
				y + 1,
				containerWidth - containerPadding,
				containerHeight
			);
			ctx.beginPath();
			ctx.moveTo(containerPadding + x + 0, y + containerHeight);
			ctx.lineTo(
				containerPadding + x + containerWidth / 4,
				y + containerHeight / 3
			);
			ctx.lineTo(
				containerPadding + x + (containerWidth / 4) * 2,
				y + containerHeight
			);
			ctx.lineTo(
				containerPadding + x + (containerWidth / 4) * 3,
				y + containerHeight / 2
			);
			ctx.lineTo(
				containerPadding + x + (containerWidth / 4) * 4,
				y + containerHeight
			);
			ctx.stroke();

			ctx.beginPath();
			ctx.arc(
				containerPadding + x + containerWidth / 2 - 2,
				y + containerHeight / 2 - 2,
				3,
				0,
				2 * Math.PI
			);
			ctx.stroke();

			y += containerHeight + 2;
		} else if ($isListNode(node)) {
			const childrenSize = node.getChildrenSize();
			for (let i = 0; i < childrenSize; i++) {
				const listPaddingLeft = 10;
				ctx.fillStyle = "#5e6169";
				ctx.fillRect(
					x + listPaddingLeft,
					y + i * LINE_HEIGHT + i * LINE_PADDING,
					4,
					LINE_HEIGHT
				);
				ctx.fillStyle = "#a9afc0";
				ctx.fillRect(
					x + listPaddingLeft + 6,
					y + LINE_HEIGHT * i + LINE_PADDING * i,
					canvasWidth - 35,
					LINE_HEIGHT
				);
			}
			y +=
				LINE_HEIGHT * childrenSize +
				LINE_PADDING * Math.max(childrenSize - 1, 0) +
				2;
		} else if ($isHeadingNode(node)) {
			ctx.fillRect(x, y, canvasWidth * 0.8, LINE_HEIGHT * 2);
			y += LINE_HEIGHT * 2 + LINE_PADDING;
		} else if ($isQuoteNode(node)) {
			const quotePaddingLeft = 10;
			ctx.fillRect(x + quotePaddingLeft, y, 4, LINE_HEIGHT * 2 + LINE_PADDING);

			// ctx.fillRect(x + quotePaddingLeft + 6, y, LINE_HEIGHT - 25, LINE_PADDING);
			ctx.fillRect(
				x + quotePaddingLeft + 6,
				y + LINE_HEIGHT,
				canvasWidth - 35,
				LINE_HEIGHT
			);

			y += LINE_HEIGHT * 2 + LINE_PADDING + 2;
		} else if ($isSplitLayoutContainerNode(node)) {
			const childNodes = node.getChildren();
			const leftNodes = childNodes[0];
			const rightNodes = childNodes[1];

			if (
				$isSplitLayoutColumnNode(leftNodes) &&
				$isSplitLayoutColumnNode(rightNodes)
			) {
				const drawnHeightLeft = outlineNodes(
					leftNodes.getChildren(),
					ctx,
					brandColor,
					x,
					y,
					canvasWidth / 2 - LAYOUT_PADDING
				);
				const drawnHeightRight = outlineNodes(
					rightNodes.getChildren(),
					ctx,
					brandColor,
					x + LAYOUT_PADDING + canvasWidth / 2,
					y,
					canvasWidth / 2 - LAYOUT_PADDING
				);

				y += Math.max(drawnHeightLeft, drawnHeightRight) + LINE_PADDING;
			}
		} else if ($isRemarkContainerNode(node)) {
			const childNodes = node.getChildren();
			const remarkContent = childNodes[1];
			let drawnHeight = 0;
			if ($isRemarkContentNode(remarkContent)) {
				drawnHeight = outlineNodes(
					remarkContent.getChildren(),
					ctx,
					brandColor,
					x + 15,
					y + LINE_PADDING,
					canvasWidth - 15
				);
			}
			ctx.strokeRect(x, y, canvasWidth, drawnHeight + 5);
			y += drawnHeight + LINE_PADDING * 3;
		}
		y += BLOCK_PADDING;
	}

	ctx.strokeStyle = currentCtxStrokeStyle;
	ctx.fillStyle = currentCtxFillStyle;

	return y - startOffsetY;
};

const indexLexicalNodesToContext = (
	nodes: Array<LexicalNode>,
	highLightColor: string
) => {
	const canvas = document.createElement("canvas");
	canvas.height = 1000;
	const ctx = canvas.getContext("2d");

	const canvas2 = document.createElement("canvas");
	const ctx2 = canvas2.getContext("2d");

	if (!ctx || !ctx2) return;

	const drawnHeight = outlineNodes(
		nodes,
		ctx,
		highLightColor,
		0,
		0,
		CANVAS_WIDTH
	);
	if (drawnHeight > 0) {
		canvas2.height = drawnHeight;
		const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, drawnHeight);
		ctx2.putImageData(imageData, 0, 0);
	}

	return canvas2;
};

type MinimapPluginProps = {
	anchorElem: HTMLElement;
	sidebarPortal: HTMLElement;
};
const MinimapPlugin = ({ anchorElem, sidebarPortal }: MinimapPluginProps) => {
	const [brandColor] = useToken("colors", ["brand.100"]);
	const scrollIndicatorRef = useRef<HTMLDivElement>(null);
	const scrollIndicatorTopRef = useRef<HTMLDivElement>(null);
	const scrollIndicatorBottomRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const scrollBackgroundRef = useRef<HTMLDivElement>(null);
	const [editor] = useLexicalComposerContext();
	const dragParams = useRef({
		dragging: false,
		startY: 0,
		anchorTop: 0,
		backgroundTop: 0,
	});

	const height = 200;
	const width = CANVAS_WIDTH + 10;

	const updateMinimap = useCallback(() => {
		const scrollerElem = scrollIndicatorRef.current;
		if (!scrollerElem) {
			return;
		}

		const contentHeight = anchorElem.scrollHeight;
		const clientHeight = anchorElem.clientHeight;

		const scrollBg = scrollBackgroundRef.current;
		if (!scrollBg) return;

		const scrollerHeight = (clientHeight / contentHeight) * height;

		const scrollTop = anchorElem.scrollTop;
		const pos = scrollTop / contentHeight;

		if (contentHeight <= clientHeight) {
			scrollerElem.style.transform = "translateY(0px)";
			scrollerElem.style.height = "0px";
			scrollerElem.style.width = "0px";
		} else {
			scrollerElem.style.transform = `translateY(${pos * height}px)`;
			scrollerElem.style.height = `${scrollerHeight}px`;
			scrollerElem.style.width = "100%";
		}

		const scrollerTopHeight = pos * height;

		const scrollerBottomHeight = height - scrollerTopHeight - scrollerHeight;

		if (scrollIndicatorTopRef.current) {
			scrollIndicatorTopRef.current.style.height = `${scrollerTopHeight}px`;
		}
		if (scrollIndicatorBottomRef.current) {
			scrollIndicatorBottomRef.current.style.height = `${scrollerBottomHeight}px`;
		}

		const scrollBackgroundElem = scrollBackgroundRef.current;
		const scrollIndicatorElem = scrollIndicatorRef.current;
		if (scrollBackgroundElem && scrollIndicatorElem) {
			const anchorScrollTop = anchorElem.scrollTop;
			const anchorScrollHeight = anchorElem.scrollHeight;
			const anchorDeltaScroll =
				anchorScrollTop / (anchorScrollHeight - anchorElem.clientHeight);

			const scrollerScrollHeight = scrollBackgroundElem.scrollHeight;
			const scrollTreshhold = scrollIndicatorElem.clientHeight / 4;
			const scrollerDelta = Math.round(
				anchorDeltaScroll *
					(scrollerScrollHeight -
						scrollBackgroundElem.clientHeight +
						scrollTreshhold * 2) -
					scrollTreshhold
			);

			scrollBackgroundElem.scrollTo({ top: scrollerDelta });
		}
	}, [anchorElem]);

	const indexEditorToOutline = useCallback(() => {
		editor.getEditorState().read(() => {
			const root = $getRoot();
			const children = root.getChildren();
			const canvas = indexLexicalNodesToContext(children, brandColor);
			if (canvas) {
				scrollBackgroundRef.current?.replaceChildren(canvas);
			}
		});
	}, [brandColor, editor]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(indexEditorToOutline),
			editor.registerUpdateListener(updateMinimap),

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					indexEditorToOutline();
					return false;
				},
				COMMAND_PRIORITY_NORMAL
			)
		);
	}, [editor, indexEditorToOutline, updateMinimap]);

	const dragStart = useCallback(
		(e: MouseEvent | TouchEvent) => {
			// window.TouchEvent to work in ff
			if (window.TouchEvent && e instanceof TouchEvent) {
				dragParams.current.startY = e.touches[0]?.clientY || 0;
			} else if (e instanceof MouseEvent) {
				dragParams.current.startY = e.clientY;
			}
			dragParams.current.anchorTop = anchorElem.scrollTop;
			dragParams.current.dragging = true;

			const currentScrollIndicator = scrollIndicatorRef.current;
			if (currentScrollIndicator) {
				currentScrollIndicator.style.cursor = "grabbing";
			}
		},
		[anchorElem]
	);
	const drag = useCallback(
		(e: MouseEvent | TouchEvent) => {
			if (!scrollContainerRef.current || !dragParams.current.dragging) {
				return;
			}
			const { startY, anchorTop } = dragParams.current;
			let clientY;
			if (window.TouchEvent && e instanceof TouchEvent) {
				clientY = e.touches[0]?.clientY || 0;
			} else if (e instanceof MouseEvent) {
				clientY = e.clientY;
			} else {
				return;
			}
			const yMoveDiff = clientY - startY;

			const relativeMove = yMoveDiff / height;
			const windowMove = relativeMove * anchorElem.scrollHeight;
			anchorElem.scrollTo({ top: anchorTop + windowMove });
		},
		[anchorElem]
	);
	const dragEnd = useCallback(() => {
		dragParams.current.dragging = false;
		// 	^?

		const currentScrollIndicator = scrollIndicatorRef.current;
		if (currentScrollIndicator) {
			currentScrollIndicator.style.cursor = "grab";
		}
	}, []);

	useEffect(() => {
		updateMinimap();
		window.addEventListener("resize", updateMinimap);
		anchorElem.addEventListener("scroll", updateMinimap);
		const currentScrollIndicator = scrollIndicatorRef.current;
		const currentScrollContainer = scrollContainerRef.current;
		if (currentScrollIndicator && currentScrollContainer) {
			currentScrollIndicator.addEventListener("mousedown", dragStart);
			currentScrollIndicator.addEventListener("touchstart", dragStart);
			currentScrollContainer.addEventListener("mousemove", drag);
			currentScrollContainer.addEventListener("touchmove", drag);
			currentScrollIndicator.addEventListener("touchend", dragEnd);
			currentScrollIndicator.addEventListener("mouseup", dragEnd);
			currentScrollIndicator.addEventListener("mouseleave", dragEnd);
		}
		return () => {
			anchorElem.removeEventListener("scroll", updateMinimap);
			window.removeEventListener("resize", updateMinimap);
			if (currentScrollIndicator) {
				currentScrollIndicator.removeEventListener("mousedown", dragStart);
				currentScrollIndicator.removeEventListener("mouseup", dragEnd);
				currentScrollIndicator.removeEventListener("mouseleave", dragEnd);
				currentScrollIndicator.removeEventListener("touchstart", dragStart);
				currentScrollIndicator.removeEventListener("touchend", dragEnd);
			}
			if (currentScrollContainer) {
				currentScrollContainer.removeEventListener("touchmove", drag);
				currentScrollContainer.removeEventListener("mousemove", drag);
			}
		};
	}, [drag, dragEnd, dragStart, updateMinimap, scrollIndicatorRef, anchorElem]);

	return createPortal(
		<Box pos="relative" h={`${height}px`} w={`${width}px`}>
			<Box
				pos="absolute"
				overflow="hidden"
				h={`${height}px`}
				w={`${width}px`}
				userSelect="none"
				borderRadius="3px"
				bg="#EBEDF1"
				px="5px"
				py="5px"
				ref={scrollBackgroundRef}
			/>
			<Box
				h={`${height}px`}
				w={`${width}px`}
				borderRadius={3}
				ref={scrollContainerRef}
				pos="absolute"
				overflow="hidden"
				boxShadow="inset 0px 11px 8px -10px #DDDDDD, inset 0px -11px 8px -10px #DDDDDD"
			>
				<Box
					pos="absolute"
					bg="rgba(52, 73, 102, 0.35)"
					borderRadius="3px 3px 0px 0px"
					top="0px"
					w="100%"
					ref={scrollIndicatorTopRef}
				/>
				<Box
					transition="200ms background-color ease-out"
					userSelect="none"
					ref={scrollIndicatorRef}
					pos="absolute"
					borderColor="text.100"
					borderWidth="1px"
					sx={{
						"&:hover": {
							bg: "rgba(52, 73, 102, 0.45)",
						},
					}}
					cursor="grab"
				/>
				<Box
					pos="absolute"
					bg="rgba(52, 73, 102, 0.35)"
					borderRadius="0px 0px 3px 3px"
					bottom="0px"
					w="100%"
					ref={scrollIndicatorBottomRef}
				/>
			</Box>
		</Box>,
		sidebarPortal
	);
};

export default MinimapPlugin;
