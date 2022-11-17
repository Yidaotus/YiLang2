import type { NodeKey } from "lexical";
import type { HeadingTagType } from "@lexical/rich-text";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trpc } from "@utils/trpc";
import { SHOW_FLOATING_WORD_EDITOR_COMMAND } from "@editor/Editor";
import { $createWordNode } from "@components/nodes/WordNode";
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
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $wrapNodes } from "@lexical/selection";
import React, { useState, useCallback, useEffect, useRef } from "react";

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

type Handler = (event: MouseEvent | TouchEvent) => void;
function useOnClickOutside<T extends HTMLElement = HTMLElement>(
	ref: React.RefObject<T>,
	handler: Handler
): void {
	useEffect(() => {
		const listener = (event: MouseEvent | TouchEvent) => {
			const el = ref?.current;
			if (!el || el.contains(event.target as Node)) {
				return;
			}
			handler(event);
		};
		document.addEventListener("mousedown", listener);
		document.addEventListener("touchstart", listener);
		return () => {
			document.removeEventListener("mousedown", listener);
			document.removeEventListener("touchstart", listener);
		};
	}, [ref, handler]);
}

const DropDown = () => {
	const [show, setShow] = useState(false);
	const [visible, setVisible] = useState(false);
	const dropDownRef = useRef(null);

	useOnClickOutside(dropDownRef, () => setShow(false));

	useEffect(() => {
		let tov: ReturnType<typeof setTimeout>;
		if (!show) {
			tov = setTimeout(() => {
				setVisible(false);
			}, 100);
		} else {
			setVisible(true);
		}
		return () => {
			if (tov) {
				clearTimeout(tov);
			}
		};
	}, [show]);

	return (
		<div className="relative" ref={dropDownRef}>
			<button
				className={`rounded-sm p-2 transition duration-75 ease-in-out hover:bg-slate-200 active:scale-90 ${
					show && "bg-slate-200"
				}`}
				onClick={() => setShow(!show)}
			>
				Hi
			</button>
			<div
				className={`${
					show
						? "visible scale-100 opacity-100"
						: "pointer-events-none scale-95 opacity-0"
				} ${
					!visible && "invisible"
				} absolute z-50 my-4 origin-top -translate-x-1/3 list-none divide-y divide-gray-100 rounded bg-white text-base shadow transition duration-100 ease-in-out`}
			>
				<div className="px-4 py-3">
					<span className="block text-sm">Bonnie Green</span>
					<span className="block truncate text-sm font-medium text-gray-900">
						name@flowbite.com
					</span>
				</div>
				<ul className="py-1" aria-labelledby="dropdown">
					<li>
						<a
							href="#"
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							Dashboard
						</a>
					</li>
					<li>
						<a
							href="#"
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							Settings
						</a>
					</li>
					<li>
						<a
							href="#"
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							Earnings
						</a>
					</li>
					<li>
						<a
							href="#"
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							Sign out
						</a>
					</li>
				</ul>
			</div>
		</div>
	);
};

const ToolbarPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const [idToLoad, setIdToLoad] = useState<string | null>(null);
	const x = useRef<HTMLElement>();
	x.current;
	const utils = trpc.useContext();

	const showWordEditor = useCallback(() => {
		editor.dispatchCommand(SHOW_FLOATING_WORD_EDITOR_COMMAND, undefined);
	}, [editor]);

	const wordTest = useCallback(() => {
		utils.dictionary.getWord.setData({
			translation: "TTEST",
			word: "WTEST",
			id: "undefined",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		utils.dictionary.getWord.invalidate();
		utils.dictionary.getWord.cancel();
	}, [utils.dictionary.getWord]);

	const createWord = trpc.dictionary.createWord.useMutation();

	const upsertDocument = trpc.document.createDocument.useMutation();

	const documentToLoad = trpc.document.getById.useQuery(idToLoad || "", {
		enabled: !!idToLoad,
	});

	const [blockType, setBlockType] =
		useState<keyof typeof blockTypeToBlockName>("paragraph");

	useEffect(() => {
		if (documentToLoad.data && documentToLoad.isFetched) {
			setIdToLoad(null);
			const parsedState = editor.parseEditorState(
				documentToLoad.data.serializedDocument
			);
			editor.setEditorState(parsedState);
		}
	}, [documentToLoad, editor]);

	const loadDocument = useCallback(() => {
		setIdToLoad("clah1kjb50004u5ejvqfvxs81");
	}, []);

	const saveDocument = useCallback(async () => {
		const serializedState = JSON.stringify(editor.getEditorState());
		await upsertDocument.mutate({
			title: "test upsert",
			serializedDocument: serializedState,
		});
	}, [editor, upsertDocument]);

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
				const type = $isHeadingNode(element)
					? element.getTag()
					: element.getType();
				if (type in blockTypeToBlockName) {
					setBlockType(type as keyof typeof blockTypeToBlockName);
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

	const insertWord = useCallback(async () => {
		const translation = "translation123";
		const word = await editor.getEditorState().read(async () => {
			const selection = $getSelection();
			if (!selection) {
				return;
			}
			const text = selection.getTextContent();
			return text;
		});
		if (!word) {
			return;
		}

		const newWord = await createWord.mutateAsync({ translation, word });
		editor.update(async () => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				const newWordNode = $createWordNode(
					newWord.translation,
					newWord.word,
					newWord.id
				);
				WordStore.set(newWordNode.getKey(), word);
				selection.insertNodes([newWordNode]);
			}
		});
	}, [createWord, editor]);
	return (
		<div className="textarea-bordered textarea w-full rounded-b-none p-0">
			<div className="flex gap-1 p-1">
				<button
					className={`btn-ghost btn ${blockType === "h1" && "btn-active"}`}
					onClick={formatHeading("h1")}
				>
					h1
				</button>
				<button
					className={`btn-ghost btn ${blockType === "h2" && "btn-active"}`}
					onClick={formatHeading("h2")}
				>
					h2
				</button>
				<DropDown />
				<button className="btn-ghost btn" onClick={insertWord}>
					Word
				</button>
				<button className="btn-ghost btn" onClick={selectWord}>
					Select Word
				</button>
				<button className="btn-ghost btn" onClick={saveDocument}>
					Save
				</button>
				<DropDown />
				<button className="btn-ghost btn" onClick={loadDocument}>
					Load State
				</button>
				<button className="btn-ghost btn" onClick={wordTest}>
					W TEST
				</button>
				<DropDown />
				<button className="btn-ghost btn" onClick={showWordEditor}>
					FLOATER
				</button>
			</div>
		</div>
	);
};

export default ToolbarPlugin;
