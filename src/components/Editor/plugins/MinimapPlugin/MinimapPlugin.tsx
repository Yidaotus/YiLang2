import { $isImageNode } from "@components/Editor/nodes/ImageNode";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { $isListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, useToken } from "@chakra-ui/react";
import {
	$getRoot,
	$getSelection,
	$isParagraphNode,
	COMMAND_PRIORITY_NORMAL,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
	mergeRegister,
	$getNearestBlockElementAncestorOrThrow,
} from "@lexical/utils";
import { useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

type MinimapItem =
	| { type: "h1" }
	| { type: "h2" }
	| { type: "quote" }
	| { type: "image" }
	| { type: "paragraph"; contentLength: number };

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
	const width = 100;

	const updateMinimap = useCallback(() => {
		const scrollerElem = scrollIndicatorRef.current;
		if (!scrollerElem) {
			return;
		}

		const contentHeight = anchorElem.scrollHeight;
		const clientHeight = anchorElem.offsetHeight;

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
			const editorOutline: Array<MinimapItem> = [];
			const root = $getRoot();
			const children = root.getChildren();

			let canvasHeight = 0;
			const drawPadding = 4;
			const x = 0;
			const drawWidth = width - 10;
			const drawHeight = 3;
			const linePadding = 2;
			const headingHeight = drawHeight * 2;
			let y = 0;

			for (const topLevelChild of children) {
				if ($isParagraphNode(topLevelChild)) {
					const linesToDraw = Math.ceil(
						topLevelChild.getTextContentSize() / 50
					);

					for (let i = 0; i < linesToDraw; i++) {
						canvasHeight += drawHeight + linePadding;
					}

					editorOutline.push({
						type: "paragraph",
						contentLength: topLevelChild.getTextContentSize(),
					});
				} else if ($isImageNode(topLevelChild)) {
					canvasHeight += 22;
					editorOutline.push({ type: "image" });
				} else if ($isListNode(topLevelChild)) {
					const childrenSize = topLevelChild.getChildrenSize();
					canvasHeight +=
						drawHeight * childrenSize + linePadding * childrenSize + 2;
				} else if ($isHeadingNode(topLevelChild)) {
					canvasHeight += headingHeight;
					const level = topLevelChild.getTag();
					if (level === "h1") {
						editorOutline.push({ type: "h1" });
					} else {
						editorOutline.push({ type: "h2" });
					}
				} else if ($isQuoteNode(topLevelChild)) {
					editorOutline.push({ type: "quote" });
					canvasHeight += drawHeight;
				}
				canvasHeight += drawPadding;
			}

			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				return;
			}

			canvas.height = canvasHeight;

			const selection = $getSelection();
			let selectedKeys: Array<string> = [];
			if (selection) {
				const selectedNodes = selection.getNodes();
				selectedKeys = selectedNodes.map((selectionNode) => {
					let parentNode = selectionNode.getParent();
					let currentNode = selectionNode;
					const rootNode = $getRoot();
					while (parentNode && parentNode !== rootNode) {
						currentNode = parentNode;
						parentNode = parentNode.getParent();
					}
					return currentNode?.getKey() || "";
				});
			}

			y = 0;
			for (const topLevelChild of children) {
				if (selectedKeys.includes(topLevelChild.getKey())) {
					ctx.fillStyle = brandColor;
					ctx.strokeStyle = brandColor;
				} else {
					ctx.fillStyle = "#A9AfC0";
					ctx.strokeStyle = "#A9AfC0";
				}
				if ($isParagraphNode(topLevelChild)) {
					const linesToDraw = Math.ceil(
						topLevelChild.getTextContentSize() / 50
					);

					for (let i = 0; i < linesToDraw; i++) {
						const lineWidth = i + 1 >= linesToDraw ? drawWidth - 10 : drawWidth;
						ctx.fillRect(x, y, lineWidth, drawHeight);
						y += drawHeight + linePadding;
					}

					editorOutline.push({
						type: "paragraph",
						contentLength: topLevelChild.getTextContentSize(),
					});
				} else if ($isImageNode(topLevelChild)) {
					const containerHeight = 20;
					const containerWidth = 60;
					const containerPadding = 16;

					ctx.strokeRect(
						x + containerPadding,
						y + 1,
						containerWidth,
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
					editorOutline.push({ type: "image" });
				} else if ($isListNode(topLevelChild)) {
					const childrenSize = topLevelChild.getChildrenSize();
					for (let i = 0; i < childrenSize; i++) {
						const listPaddingLeft = 10;
						ctx.fillStyle = "#5e6169";
						ctx.fillRect(
							x + listPaddingLeft,
							y + i * drawHeight + i * linePadding,
							4,
							drawHeight
						);
						ctx.fillStyle = "#a9afc0";
						ctx.fillRect(
							x + listPaddingLeft + 6,
							y + drawHeight * i + linePadding * i,
							drawWidth - 35,
							drawHeight
						);
					}
					y +=
						drawHeight * childrenSize +
						linePadding * Math.max(childrenSize - 1, 0) +
						2;
				} else if ($isHeadingNode(topLevelChild)) {
					ctx.fillRect(x, y, drawWidth * 0.8, headingHeight);

					y += headingHeight;
					const level = topLevelChild.getTag();
					if (level === "h1") {
						editorOutline.push({ type: "h1" });
					} else {
						editorOutline.push({ type: "h2" });
					}
				} else if ($isQuoteNode(topLevelChild)) {
					const quotePaddingLeft = 10;
					ctx.fillRect(
						x + quotePaddingLeft,
						y,
						4,
						drawHeight * 2 + linePadding
					);

					ctx.fillRect(x + quotePaddingLeft + 6, y, drawWidth - 25, drawHeight);
					ctx.fillRect(
						x + quotePaddingLeft + 6,
						y + linePadding + drawHeight,
						drawWidth - 35,
						drawHeight
					);

					editorOutline.push({ type: "quote" });
					y += drawHeight * 2 + linePadding + 2;
				}
				y += drawPadding;
			}

			scrollBackgroundRef.current?.replaceChildren(canvas);
		});
	}, [editor]);

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
