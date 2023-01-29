/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { HeadingTagType } from "@lexical/rich-text";
import type { NodeKey } from "lexical";

import { Box, List, ListItem, Text } from "@chakra-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TableOfContentsEntry } from "./TableOfContentsProvider";
import TableOfContentsProvider from "./TableOfContentsProvider";

const MARGIN_ABOVE_EDITOR = 624;
const HEADING_WIDTH = 9;

function isHeadingAtTheTopOfThePage(element: HTMLElement): boolean {
	const elementYPosition = element.getClientRects()?.[0]?.y;
	if (elementYPosition === undefined) {
		return false;
	}
	return (
		elementYPosition >= MARGIN_ABOVE_EDITOR &&
		elementYPosition <= MARGIN_ABOVE_EDITOR + HEADING_WIDTH
	);
}
function isHeadingAboveViewport(element: HTMLElement): boolean {
	const elementYPosition = element.getClientRects()?.[0]?.y;
	if (elementYPosition === undefined) {
		return false;
	}
	return elementYPosition < MARGIN_ABOVE_EDITOR;
}
function isHeadingBelowTheTopOfThePage(element: HTMLElement): boolean {
	const elementYPosition = element.getClientRects()?.[0]?.y;
	if (elementYPosition === undefined) {
		return false;
	}
	return elementYPosition >= MARGIN_ABOVE_EDITOR + HEADING_WIDTH;
}

const headingTagIndentations: Record<HeadingTagType, number> = {
	h1: 20,
	h2: 30,
	h3: 40,
	h4: 40,
	h5: 40,
	h6: 40,
};

function TableOfContentsList({
	tableOfContents,
	anchorElem,
	sidebarPortal,
}: {
	tableOfContents: Array<TableOfContentsEntry>;
	anchorElem: HTMLElement;
	sidebarPortal: HTMLElement;
}): JSX.Element {
	const [selectedKey, setSelectedKey] = useState("");
	const selectedIndex = useRef(0);
	const [editor] = useLexicalComposerContext();
	const preventScroll = useRef(false);
	const listRef = useRef(null);

	function scrollToNode(key: NodeKey, currIndex: number) {
		editor.getEditorState().read(() => {
			const domElement = editor.getElementByKey(key);
			if (domElement !== null) {
				preventScroll.current = true;
				domElement.scrollIntoView({ inline: "center", block: "center" });
				setSelectedKey(key);
				selectedIndex.current = currIndex;
			}
		});
	}

	useEffect(() => {
		const synchronizeScroll = () => {
			if (preventScroll.current) {
				preventScroll.current = false;
				return;
			}
			editor.getEditorState().read(() => {
				const [_, ...rest] = tableOfContents;
				for (const head of rest) {
					const element = editor.getElementByKey(head.key);
					if (!element) return;

					const elementTop = element.getBoundingClientRect().top;
					const anchorTop = anchorElem.getBoundingClientRect().top;

					const relativeTop = elementTop - anchorTop;
					if (relativeTop > 0) {
						const tocItem = document.getElementById(`toc_${head.key}`);
						if (tocItem) {
							tocItem.scrollIntoView();
						}
						return;
					}
				}
			});
		};
		let timerId: ReturnType<typeof setTimeout>;
		function debounceFunction(func: () => void, delay: number) {
			clearTimeout(timerId);
			timerId = setTimeout(func, delay);
		}

		function onScroll(): void {
			debounceFunction(synchronizeScroll, 10);
		}

		anchorElem.addEventListener("scroll", onScroll);
		return () => anchorElem.removeEventListener("scroll", onScroll);
	}, [tableOfContents, editor, anchorElem]);

	const [firstHeading, ...headingList] = tableOfContents;
	return createPortal(
		<Box
			color="#65676b"
			pos="relative"
			padding="10px"
			width="250px"
			display="flex"
			flexDirection="column"
			zIndex="1"
			transform="translateX(-25%)"
			gap={3}
		>
			{firstHeading && (
				<Box
					key={firstHeading.key}
					onClick={() => scrollToNode(firstHeading.key, 0)}
					role="button"
					tabIndex={0}
					color="black"
					fontWeight="semibold"
					cursor="pointer"
				>
					<Text>{firstHeading.text}</Text>
				</Box>
			)}
			<List
				listStyleType="none"
				marginTop="0"
				paddingLeft="3px"
				marginLeft="10px"
				width="200px"
				maxH="300px"
				overflowY="scroll"
				ref={listRef}
				sx={{
					scrollbarWidth: "none",
					"&::-webkit-scrollbar": {
						display: "none",
					},
					"&::after": {
						content: '" "',
						position: "absolute",
						display: "inline-block",
						left: "30px",
						top: "38px",
						zIndex: "100",
						height: "calc(100% - 60px)",
						width: "4px",
						marginTop: "5px",
						backgroundColor: "#ccd0d5",
						borderWidth: "2px",
						borderRadius: "2px",
					},
				}}
			>
				{headingList.map(({ key, text, tag }, index) => (
					<ListItem
						key={key}
						marginLeft={`${headingTagIndentations[tag]}px`}
						pos="relative"
						color={selectedKey === key ? "#3578e5" : "#65676b"}
						lineHeight="1.1em"
						mb={2}
						sx={{
							"&::before":
								selectedKey === key
									? {
											content: '" "',
											position: "absolute",
											display: "inline-block",
											left: `-${headingTagIndentations[tag] - 3}px`,
											top: "4px",
											zIndex: "120",
											height: "12px",
											width: "12px",
											marginTop: "5px",
											backgroundColor: "#3578e5",
											borderColor: "white",
											borderWidth: "4px",
											borderRadius: "50%",
											outline: "1px solid #b1b6bd",
									  }
									: {},
						}}
						onClick={() => scrollToNode(key, index + 1)}
						role="button"
						id={`toc_${key}`}
						tabIndex={0}
						// className={indent(tag)}
						// className={`normal-heading ${
						// 	selectedKey === key ? "selected-heading" : ""
						// }}
					>
						{("" + text).length > 27 ? text.substring(0, 27) + "..." : text}
					</ListItem>
				))}
			</List>
		</Box>,
		sidebarPortal
	);
}

type TableOfContentsPluginProps = {
	anchorElem: HTMLElement;
	sidebarPortal: HTMLElement;
};

export default function TableOfContentsPlugin(
	props: TableOfContentsPluginProps
) {
	return (
		<TableOfContentsProvider>
			{(tableOfContents) => {
				return (
					<TableOfContentsList tableOfContents={tableOfContents} {...props} />
				);
			}}
		</TableOfContentsProvider>
	);
}
