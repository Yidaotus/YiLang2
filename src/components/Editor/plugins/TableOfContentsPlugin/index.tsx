/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { HeadingTagType } from "@lexical/rich-text";
import type { NodeKey } from "lexical";

import { Box, List, ListItem } from "@chakra-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useRef, useState } from "react";
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

	function scrollToNode(key: NodeKey, currIndex: number) {
		editor.getEditorState().read(() => {
			const domElement = editor.getElementByKey(key);
			if (domElement !== null) {
				domElement.scrollIntoView({ inline: "center", block: "center" });
				setSelectedKey(key);
				selectedIndex.current = currIndex;
			}
		});
	}

	// useEffect(() => {
	// 	function scrollCallback() {
	// 		if (
	// 			tableOfContents.length !== 0 &&
	// 			selectedIndex.current < tableOfContents.length - 1
	// 		) {
	// 			const currentKey = tableOfContents[selectedIndex.current]?.[0];
	// 			if (!currentKey) return;
	// 			let currentHeading = editor.getElementByKey(currentKey);

	// 			if (currentHeading !== null) {
	// 				if (isHeadingBelowTheTopOfThePage(currentHeading)) {
	// 					//On natural scroll, user is scrolling up
	// 					while (
	// 						currentHeading !== null &&
	// 						isHeadingBelowTheTopOfThePage(currentHeading) &&
	// 						selectedIndex.current > 0
	// 					) {
	// 						const prevHeadingKey =
	// 							tableOfContents[selectedIndex.current - 1]?.[0];
	// 						if (!prevHeadingKey) break;

	// 						const prevHeading = editor.getElementByKey(prevHeadingKey);
	// 						if (
	// 							prevHeading !== null &&
	// 							(isHeadingAboveViewport(prevHeading) ||
	// 								isHeadingBelowTheTopOfThePage(prevHeading))
	// 						) {
	// 							selectedIndex.current--;
	// 						}
	// 						currentHeading = prevHeading;
	// 					}
	// 					const prevHeadingKey = tableOfContents[selectedIndex.current]?.[0];
	// 					if (!prevHeadingKey) return;
	// 					setSelectedKey(prevHeadingKey);
	// 				} else if (isHeadingAboveViewport(currentHeading)) {
	// 					//On natural scroll, user is scrolling down
	// 					while (
	// 						currentHeading !== null &&
	// 						isHeadingAboveViewport(currentHeading) &&
	// 						selectedIndex.current < tableOfContents.length - 1
	// 					) {
	// 						const nextHeading = editor.getElementByKey(
	// 							tableOfContents[selectedIndex.current + 1][0]
	// 						);
	// 						if (
	// 							nextHeading !== null &&
	// 							(isHeadingAtTheTopOfThePage(nextHeading) ||
	// 								isHeadingAboveViewport(nextHeading))
	// 						) {
	// 							selectedIndex.current++;
	// 						}
	// 						currentHeading = nextHeading;
	// 					}
	// 					const nextHeadingKey = tableOfContents[selectedIndex.current][0];
	// 					setSelectedKey(nextHeadingKey);
	// 				}
	// 			}
	// 		} else {
	// 			selectedIndex.current = 0;
	// 		}
	// 	}
	// 	let timerId: ReturnType<typeof setTimeout>;

	// 	function debounceFunction(func: () => void, delay: number) {
	// 		clearTimeout(timerId);
	// 		timerId = setTimeout(func, delay);
	// 	}

	// 	function onScroll(): void {
	// 		debounceFunction(scrollCallback, 10);
	// 	}

	// 	document.addEventListener("scroll", onScroll);
	// 	return () => document.removeEventListener("scroll", onScroll);
	// }, [tableOfContents, editor]);
	const [firstHeading, ...headingList] = tableOfContents;

	return createPortal(
		<Box
			color="#65676b"
			pos="relative"
			padding="10px"
			width="250px"
			display="flex"
			flex-direction="row"
			justify-content="flex-start"
			zIndex="1"
			transform="translateX(-25%)"
		>
			<List
				listStyleType="none"
				marginTop="0"
				paddingLeft="3px"
				marginLeft="10px"
				width="200px"
				maxH="400px"
				overflowY="scroll"
				sx={{
					scrollbarWidth: "none",
					"&::-webkit-scrollbar": {
						display: "none",
					},
					"&::before": {
						content: '" "',
						position: "absolute",
						display: "inline-block",
						left: "25px",
						top: "10px",
						zIndex: "100",
						height: "calc(100% - 20px)",
						width: "4px",
						marginTop: "5px",
						backgroundColor: "#ccd0d5",
						borderWidth: "2px",
						borderRadius: "2px",
					},
				}}
			>
				{firstHeading && (
					<ListItem
						paddingLeft="20px"
						pos="relative"
						key={firstHeading.key}
						onClick={() => scrollToNode(firstHeading.key, 0)}
						role="button"
						tabIndex={0}
						color="black"
						fontWeight="semibold"
						cursor="pointer"
					>
						{firstHeading.text}
					</ListItem>
				)}
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
											left: `-${headingTagIndentations[tag] + 2}px`,
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
