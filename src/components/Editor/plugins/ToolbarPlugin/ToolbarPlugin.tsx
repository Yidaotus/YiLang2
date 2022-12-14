import type { NodeKey } from "lexical";
import type { HeadingTagType } from "@lexical/rich-text";

import { $getRoot } from "lexical";
import { FORMAT_ELEMENT_COMMAND } from "lexical";

import {
	Button,
	ButtonGroup,
	Menu,
	MenuItem,
	MenuButton,
	MenuList,
	Box,
	IconButton,
} from "@chakra-ui/react";
import {
	$isListNode,
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListNode,
	REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import {
	$getSelection,
	$isRangeSelection,
	$isRootOrShadowRoot,
	$isNodeSelection,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	$createParagraphNode,
	$createNodeSelection,
	$setSelection,
} from "lexical";
import {
	$findMatchingParent,
	$getNearestNodeOfType,
	mergeRegister,
} from "@lexical/utils";
import {
	$createHeadingNode,
	$isHeadingNode,
	$createQuoteNode,
} from "@lexical/rich-text";
import { $wrapNodes } from "@lexical/selection";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";

const blockTypeToBlockName = {
	bullet: "Bulleted List",
	check: "Check List",
	code: "Code Block",
	h1: "Heading 1",
	h2: "Heading 2",
	h3: "Heading 3",
	h4: "Heading 4",
	h5: "Heading 5",
	h6: "Heading 6",
	number: "Numbered List",
	paragraph: "Normal",
	quote: "Quote",
};

const WordStore = new Map<NodeKey, string>();

const ToolbarPlugin = ({ documentId }: { documentId?: string }) => {
	const router = useRouter();
	const [editor] = useLexicalComposerContext();

	const upsertDocument = trpc.document.upsertDocument.useMutation({
		onSuccess: (data) => {
			if (!documentId) {
				router.push(`/editor/${data.id}`);
			}
		},
	});

	const [blockType, setBlockType] =
		useState<keyof typeof blockTypeToBlockName>("paragraph");

	const saveDocument = useCallback(async () => {
		const serializedState = JSON.stringify(editor.getEditorState());
		editor.getEditorState().read(() => {
			const root = $getRoot();
			const rootElements = root.getChildren();
			let title = "";
			for (const node of rootElements) {
				if ($isHeadingNode(node)) {
					title = node.getTextContent();
					break;
				}
			}
			upsertDocument.mutate({
				id: documentId,
				title,
				serializedDocument: serializedState,
			});
		});
	}, [documentId, editor, upsertDocument]);

	const updateToolbar = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const anchorNode = selection.anchor.getNode();
			let element =
				anchorNode.getKey() === "root"
					? anchorNode
					: $findMatchingParent(anchorNode, (e) => {
							const parent = e.getParent();
							return parent !== null && $isRootOrShadowRoot(parent);
					  });

			if (element === null) {
				element = anchorNode.getTopLevelElementOrThrow();
			}

			const elementKey = element.getKey();
			const elementDOM = editor.getElementByKey(elementKey);

			if (elementDOM !== null) {
				const type = $isHeadingNode(element)
					? element.getTag()
					: element.getType();
				if (type in blockTypeToBlockName) {
					setBlockType(type as keyof typeof blockTypeToBlockName);
				}
			}
		}
		if ($isNodeSelection(selection)) {
			const anchorNode = selection.getNodes()[0];
			if (!anchorNode) {
				return;
			}
			let element =
				anchorNode.getKey() === "root"
					? anchorNode
					: $findMatchingParent(anchorNode, (e) => {
							const parent = e.getParent();
							return parent !== null && $isRootOrShadowRoot(parent);
					  });

			if (element === null) {
				element = anchorNode.getTopLevelElementOrThrow();
			}

			const elementKey = element.getKey();
			const elementDOM = editor.getElementByKey(elementKey);

			if (elementDOM !== null) {
				if ($isListNode(element)) {
					const parentList = $getNearestNodeOfType<ListNode>(
						anchorNode,
						ListNode
					);
					const type = parentList
						? parentList.getListType()
						: element.getListType();
					setBlockType(type);
				} else {
					const type = $isHeadingNode(element)
						? element.getTag()
						: element.getType();
					if (type in blockTypeToBlockName) {
						setBlockType(type as keyof typeof blockTypeToBlockName);
					}
				}
			}
		}
	}, [editor]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updateToolbar();
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			),
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updateToolbar();
				});
			})
		);
	}, [editor, updateToolbar]);

	const formatHeading = (headingSize: HeadingTagType) => () => {
		editor.update(() => {
			const selection = $getSelection();
			console.debug({ selection });

			if ($isRangeSelection(selection)) {
				if (blockType === headingSize) {
					$wrapNodes(selection, () => $createParagraphNode());
				} else {
					$wrapNodes(selection, () => $createHeadingNode(headingSize));
				}
			}
		});
	};

	const selectWord = useCallback(() => {
		editor.update(() => {
			const [targetKey] = WordStore.keys();

			if (!targetKey) {
				return;
			}

			const nodeSelection = $createNodeSelection();
			nodeSelection.add(targetKey);
			$setSelection(nodeSelection);
		});
	}, [editor]);

	const formatParagraph = () => {
		if (blockType !== "paragraph") {
			editor.update(() => {
				const selection = $getSelection();

				if ($isRangeSelection(selection)) {
					$wrapNodes(selection, () => $createParagraphNode());
				}
			});
		}
	};

	const formatBulletList = () => {
		console.debug("Format B List");
		console.debug({ blockType });
		if (blockType !== "bullet") {
			editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
		} else {
			editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
		}
	};

	const formatCheckList = () => {
		if (blockType !== "check") {
			editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
		} else {
			editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
		}
	};

	const formatNumberedList = () => {
		if (blockType !== "number") {
			editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
		} else {
			editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
		}
	};

	const formatQuote = () => {
		if (blockType !== "quote") {
			editor.update(() => {
				const selection = $getSelection();

				if ($isRangeSelection(selection)) {
					$wrapNodes(selection, () => $createQuoteNode());
				}
			});
		}
	};

	return (
		<Box
			sx={{
				position: "fixed",
				bottom: "50px",
				right: "50px",
				zIndex: 40,
				bg: "white",
				borderRadius: "5px",
				boxShadow:
					"0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
			}}
		>
			<ButtonGroup isAttached variant="outline" sx={{ w: "100%" }}>
				<Menu>
					<MenuButton as={Button}>Alignment</MenuButton>
					<MenuList>
						<MenuItem
							onClick={() =>
								editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
							}
						>
							Left
						</MenuItem>
						<MenuItem
							onClick={() =>
								editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
							}
						>
							Center
						</MenuItem>
						<MenuItem
							onClick={() =>
								editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
							}
						>
							Right
						</MenuItem>
						<MenuItem
							onClick={() =>
								editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
							}
						>
							Justify
						</MenuItem>
					</MenuList>
				</Menu>
				<Menu>
					<MenuButton
						as={IconButton}
						icon={<img src={`/icons/${blockType}.svg`} />}
					>
						{blockType}
					</MenuButton>
					<MenuList>
						<MenuItem onClick={formatHeading("h1")}>H1</MenuItem>
						<MenuItem onClick={formatHeading("h2")}>H2</MenuItem>
						<MenuItem onClick={formatHeading("h3")}>H3</MenuItem>
						<MenuItem onClick={formatHeading("h4")}>H4</MenuItem>
						<MenuItem onClick={() => formatParagraph()}>Paragraph</MenuItem>
						<MenuItem onClick={() => formatBulletList()}>B List</MenuItem>
						<MenuItem onClick={() => formatNumberedList()}>N List</MenuItem>
						<MenuItem onClick={() => formatQuote()}>Quote</MenuItem>
					</MenuList>
				</Menu>
				<Button onClick={() => saveDocument()} as={Button}>
					Save
				</Button>
				<Box sx={{ flexGrow: 1 }} />
			</ButtonGroup>
		</Box>
	);
};

export default ToolbarPlugin;
