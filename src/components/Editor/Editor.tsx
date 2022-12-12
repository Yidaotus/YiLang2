import {
	$getNodeByKey,
	$isDecoratorNode,
	$isElementNode,
	$isRangeSelection,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_CRITICAL,
	DecoratorNode,
	ElementNode,
	Klass,
	LexicalCommand,
	LexicalNode,
} from "lexical";
import {
	$createNodeSelection,
	$getSelection,
	$isNodeSelection,
	$setSelection,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
} from "lexical";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createCommand } from "lexical";

import { Box, SkeletonText } from "@chakra-ui/react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { mergeRegister } from "@lexical/utils";

import YiLangTheme from "./themes/YiLangEditorTheme";
import ErrorBoundary from "./ui/ErrorBoundary";
import { $isWordNode, WordNode } from "./nodes/WordNode";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingToolbarPlugin/FloatingToolbarPlugin";
import FloatingWordEditorPlugin from "./plugins/FloatingWordEditor/FloatingWordEditor";
import FetchDocumentPlugin from "./plugins/FetchDocumentPlugin/FetchDocumentPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin/ToolbarPlugin";
import PersistStateOnPageChangePlugion from "./plugins/PersistantStateOnPageChangePlugin/PersistantStateOnPageChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createPortal } from "react-dom";
import { setFloatingElemPosition } from "./utils/setFloatingPosition";
import { ImageNode } from "./nodes/ImageNode";
import ImagesPlugin from "./plugins/ImagePlugin/ImagePlugin";
import { trpc } from "@utils/trpc";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { Prose } from "@nikolovlazar/chakra-ui-prose";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin/ListMaxIndentLevelPlugin";

const EditorNodes: Array<Klass<LexicalNode>> = [
	HeadingNode,
	ListNode,
	ListItemNode,
	QuoteNode,
	CodeNode,
	TableNode,
	TableCellNode,
	TableRowNode,
	HashtagNode,
	CodeHighlightNode,
	AutoLinkNode,
	LinkNode,
	OverflowNode,
	HorizontalRuleNode,
	ImageNode,
	MarkNode,
	WordNode,
];

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
	console.error(error);
}

export const SHOW_FLOATING_WORD_EDITOR_COMMAND: LexicalCommand<void> =
	createCommand("SHOW_FLOATING_WORD_EDITOR_COMMAN");

type EditorProps = {
	id?: string;
	scrollAnchor?: HTMLElement;
};

const WordPopupPlugin = ({ anchorElem }: { anchorElem: HTMLElement }) => {
	const elem = useRef<HTMLDivElement | null>(null);
	const [wordNode, setWordNode] = useState<{
		id?: string;
		word: string;
		translations: Array<string>;
	} | null>(null);
	const dbWord = trpc.dictionary.getWord.useQuery(wordNode?.id || "", {
		enabled: !!wordNode?.id,
	});
	const [editor] = useLexicalComposerContext();

	const updatePopup = useCallback(() => {
		if (!elem.current) return;

		const selection = $getSelection();

		if (!$isNodeSelection(selection)) {
			setFloatingElemPosition({
				targetRect: null,
				floatingElem: elem.current,
				anchorElem,
			});
			return;
		}

		const node = selection.getNodes();
		if (node.length < 1) return;

		const target = node[0];
		if (!$isWordNode(target)) return;

		setWordNode({
			id: target.getId(),
			word: target.getWord(),
			translations: target.getTranslations(),
		});
		const domPos = editor.getElementByKey(target.getKey());

		if (!domPos || !elem.current) return;
		const clientRect = domPos.getBoundingClientRect();
		const elemRect = elem.current.getBoundingClientRect();

		setFloatingElemPosition({
			targetRect: clientRect,
			floatingElem: elem.current,
			anchorElem,
			verticalOffset: 5,
		});
	}, [anchorElem, editor]);

	useEffect(() => {
		document.addEventListener("resize", updatePopup);
		return () => document.removeEventListener("resize", updatePopup);
	}, [updatePopup]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					updatePopup();
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					updatePopup();
				});
			})
		);
	}, [editor, updatePopup]);

	return createPortal(
		<Box
			ref={elem}
			sx={{
				pos: "absolute",
				display: !!wordNode ? "block" : "none",
				top: 0,
				left: 0,
				zIndex: 30,
				width: "150px",
				borderRadius: "5px",
				border: "1px solid #eaeaea",
				p: 2,
				bg: "white",
				boxShadow:
					"0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
			}}
		>
			<Box sx={{ display: "flex", flexDir: "column" }}>
				<Box>
					{dbWord.data?.translations.join(" ") ||
						wordNode?.translations.join(" ")}
				</Box>
				<Box>
					{dbWord.data?.tags.map((t) => (
						<span key={t.tagId}>{t.tag.name}</span>
					))}
				</Box>
			</Box>
		</Box>,
		anchorElem
	);
};

type BlockEditorPosition = {
	left: number;
	top: number;
};

type BlockEditorProps = {
	anchorElem: HTMLElement;
};
const BlockEditorPlugin = ({ anchorElem }: BlockEditorProps) => {
	const [editor] = useLexicalComposerContext();
	const [position, setPosition] = useState<BlockEditorPosition | null>(null);

	const updateToolbar = useCallback(() => {
		setPosition(null);
		const selection = $getSelection();
		let element: ElementNode | DecoratorNode<unknown> | null = null;
		if ($isRangeSelection(selection)) {
			const anchorNode = selection.anchor.getNode();
			const focusNode = selection.focus.getNode();

			const anchorElement = anchorNode.getTopLevelElementOrThrow();
			const focusElement = focusNode.getTopLevelElementOrThrow();

			if (!anchorElement || !focusElement) {
				return;
			}

			if (focusElement.getKey() !== anchorElement.getKey()) {
				return;
			}

			if ($isElementNode(focusElement)) {
				element = focusElement;
			}
		} else if ($isNodeSelection(selection)) {
			const anchorNode = selection.getNodes()[0];
			if (!anchorNode) {
				return;
			}
			if ($isDecoratorNode(anchorNode)) {
				element = anchorNode.getTopLevelElementOrThrow();
			}
		}
		if (!element) {
			return;
		}
		const elementDOM = editor.getElementByKey(element.getKey());

		if (!elementDOM) {
			return;
		}

		const bounding = elementDOM.getBoundingClientRect();
		const elementType = element.getType();

		setPosition({
			left: bounding.left,
			top:
				bounding.top +
				anchorElem.scrollTop -
				anchorElem.getBoundingClientRect().top,
		});
	}, [anchorElem, editor]);

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

	return position ? (
		<Box
			zIndex={50}
			position="absolute"
			top={position.top}
			left={position.left}
			w="50px"
			h="50px"
			bg="gray.700"
		/>
	) : null;
};

const WordListPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const [wordStore, setWordStore] = useState<Record<string, string>>({});

	useEffect(() => {
		/*
			editor.registerDecoratorListener<any>((decorators) => {
				console.debug({ decorators });
				setWordStore(
					Object.entries(decorators)
						.filter(([key, value]) => value?.props?.word)
						.map(([key, value]) => ({
							key,
							text: value.props.word,
						}))
				);
			})
			*/
		// Fixed in 0.6.5 see https://github.com/facebook/lexical/issues/3490
		return editor.registerMutationListener(WordNode, (mutatedNodes) => {
			for (const [nodeKey, mutation] of mutatedNodes) {
				console.debug({ nodeKey, mutation });
				if (mutation === "created") {
					editor.getEditorState().read(() => {
						const wordNode = $getNodeByKey(nodeKey) as WordNode;
						const wordText = wordNode.getWord();
						setWordStore((currentStore) => ({
							...currentStore,
							[nodeKey]: wordText,
						}));
					});
				}
				if (mutation === "destroyed") {
					setWordStore((currentStore) => {
						delete currentStore[nodeKey];
						return { ...currentStore };
					});
				}
			}
		});
	}, [editor]);

	const highlightWord = useCallback(
		(key: string) => {
			editor.update(() => {
				const newSelection = $createNodeSelection();
				newSelection.add(key);
				$setSelection(newSelection);
			});
		},
		[editor]
	);

	return (
		<div>
			<ul>
				{Object.entries(wordStore).map(([nodeKey, word]) => (
					<li key={nodeKey}>
						<button onClick={() => highlightWord(nodeKey)}>{word}</button>
					</li>
				))}
			</ul>
		</div>
	);
};

type MinimapPluginProps = {
	anchorElem: HTMLElement;
};
const MinimapPlugin = ({ anchorElem }: MinimapPluginProps) => {
	const scrollIndicatorRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const dragParams = useRef({ dragging: false, startY: 0, anchorTop: 0 });
	const height = 250;
	const width = 70;

	console.debug({ dragParams });

	const updateMinimap = useCallback(() => {
		const scrollerElem = scrollIndicatorRef.current;
		if (!scrollerElem) {
			return;
		}

		const contentHeight = anchorElem.scrollHeight;
		const clientHeight = anchorElem.offsetHeight;

		console.debug({ contentHeight, clientHeight });

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
		}
	}, [anchorElem]);

	const dragStart = useCallback(
		(e: MouseEvent | TouchEvent) => {
			if (e instanceof TouchEvent) {
				dragParams.current.startY = e.touches[0]?.clientY || 0;
			} else {
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
			const dragStartPos = dragParams.current.startY;
			const anchorTop = dragParams.current.anchorTop;
			let clientY;
			if (e instanceof TouchEvent) {
				clientY = e.touches[0]?.clientY || 0;
			} else {
				clientY = e.clientY;
			}
			const yMoveDiff = clientY - dragStartPos;
			const relativeMove = yMoveDiff / height;
			const windowMove = relativeMove * anchorElem.scrollHeight;

			anchorElem.scrollTo({ top: anchorTop + windowMove });
		},
		[anchorElem]
	);
	const dragEnd = useCallback(() => {
		dragParams.current.dragging = false;
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

	return (
		<Box
			h={`${height}px`}
			pos="absolute"
			w={`${width}px`}
			bg="rgba(0, 0, 0, 0.2)"
			top="20px"
			right={{ sm: 10, md: 10, lg: 10, xl: 10 }}
			borderRadius={3}
			bgImage='url("/images/scrollBg.png")'
			bgRepeat="repeat-y"
			ref={scrollContainerRef}
		>
			<Box
				userSelect="none"
				borderRadius={3}
				ref={scrollIndicatorRef}
				pos="absolute"
				bg="rgba(13, 43, 48, 0.3)"
				w="100%"
				cursor="grab"
			/>
		</Box>
	);
};

export default function Editor({ id, scrollAnchor }: EditorProps) {
	const initialConfig = {
		namespace: "MyEditor",
		theme: YiLangTheme,
		editorState: undefined,
		onError,
		nodes: [...EditorNodes],
	};

	const [floatingAnchorElem, setFloatingAnchorElem] =
		useState<HTMLDivElement | null>(null);
	const onFloatingRef = (_floatingAnchorElem: HTMLDivElement) => {
		if (_floatingAnchorElem !== null) {
			setFloatingAnchorElem(_floatingAnchorElem);
		}
	};

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
				}}
			>
				<div>
					<LexicalComposer initialConfig={initialConfig}>
						<ToolbarPlugin documentId={id} />
						<RichTextPlugin
							contentEditable={
								<Box
									sx={{
										pos: "relative",
									}}
									ref={onFloatingRef}
								>
									<ContentEditable
										style={{
											outline: "none",
										}}
									/>
								</Box>
							}
							placeholder={<div>Enter some text...</div>}
							ErrorBoundary={ErrorBoundary}
						/>
						<HistoryPlugin />
						<PersistStateOnPageChangePlugion />
						<FetchDocumentPlugin id={id as string} />
						<ListMaxIndentLevelPlugin maxDepth={4} />
						<WordListPlugin />
						<ListPlugin />
						<ImagesPlugin />
						<>
							{scrollAnchor && <MinimapPlugin anchorElem={scrollAnchor} />}
							{floatingAnchorElem && (
								<>
									<FloatingTextFormatToolbarPlugin
										anchorElem={floatingAnchorElem}
									/>
									<FloatingWordEditorPlugin anchorElem={floatingAnchorElem} />
									<WordPopupPlugin anchorElem={floatingAnchorElem} />
								</>
							)}
						</>
					</LexicalComposer>
				</div>
			</Box>
		</Box>
	);
}
