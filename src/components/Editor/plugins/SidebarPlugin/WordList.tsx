import type { Middleware } from "@floating-ui/dom";
import type { ReferenceType } from "@floating-ui/react";

import {
	Box,
	Button,
	FormControl,
	FormLabel,
	Switch,
	Text,
	useToken,
} from "@chakra-ui/react";
import { WordNode } from "@components/Editor/nodes/WordNode";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import Word from "@components/Word";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useEditorStore from "@store/store";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import {
	$createNodeSelection,
	$getNodeByKey,
	$setSelection,
	LineBreakNode,
} from "lexical";
import router from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoLanguageOutline } from "react-icons/io5";
import shallow from "zustand/shallow";

const clipTop: Middleware = {
	name: "clipToTop",
	fn({ y }) {
		if (y < -230) {
			return {
				y: y + (-230 - y),
			};
		}
		return {};
	},
};

const WordList = () => {
	const [text400] = useToken("colors", ["text.400"]);
	const [editor] = useLexicalComposerContext();
	const { highlight: targetWord } = router.query;
	const targetWordId = Array.isArray(targetWord) ? targetWord[0] : targetWord;
	const { hideAutoFillWords, setHideAutoFillWords } = useEditorStore(
		(state) => ({
			hideAutoFillWords: state.editorHideAutoFillWords,
			setHideAutoFillWords: state.setEditorHideAutoFillWords,
		}),
		shallow
	);
	//@TODO Idea pull out wordStore into plugin so other plugins can hook into it by bear
	const [wordStore, setWordStore] = useState<
		Record<string, { wordId: string; isAutoFill: boolean }>
	>({});
	const buttonRef = useRef(null);
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const floatingRef = useRef(null);
	useOnClickOutside(floatingRef, () => {
		setPopupReference(null);
	});

	useEffect(() => {
		return editor.registerNodeTransform(LineBreakNode, (node) => {
			node.remove();
		});
	}, [editor]);

	useEffect(() => {
		/*
			editor.registerDecoratorListener<any>((decorators) => {
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
				if (mutation === "created") {
					editor.getEditorState().read(() => {
						const wordNode = $getNodeByKey(nodeKey) as WordNode;

						const wordId = wordNode.getId();
						if (!wordId) return;

						const isAutoFill = wordNode.getIsAutoFill();

						setWordStore((currentStore) => ({
							...currentStore,
							[nodeKey]: {
								wordId,
								isAutoFill,
							},
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
			if (key) {
				editor.update(() => {
					const nodeElem = editor.getElementByKey(key);
					if (nodeElem) {
						nodeElem.scrollIntoView({
							block: "center",
							inline: "nearest",
						});
						setPopupReference(null);
						const newSelection = $createNodeSelection();
						newSelection.add(key);
						$setSelection(newSelection);
					}
				});
			}
		},
		[editor]
	);

	useEffect(() => {
		if (targetWordId) {
			const targetInStore = Object.entries(wordStore).find(
				([_, node]) => targetWordId === node.wordId
			);
			if (targetInStore) {
				highlightWord(targetInStore[0]);
			}
		}
	}, [highlightWord, targetWordId, wordStore]);

	return (
		<>
			<Button
				leftIcon={<IoLanguageOutline size={20} color={text400} />}
				gridColumn="span 2"
				variant={!!popupReference ? "solid" : "ghost"}
				aria-label="Appereance"
				color="text.400"
				disabled={Object.entries(wordStore).length < 1}
				ref={buttonRef}
				onClick={() =>
					setPopupReference(popupReference ? null : buttonRef.current)
				}
			>
				Words
			</Button>
			<div ref={floatingRef}>
				<FloatingContainer
					popupPlacement="left"
					popupReference={popupReference}
					middlewares={[clipTop]}
					showArrow
				>
					<Box
						display="flex"
						flexDir="column"
						gap={4}
						maxW="350px"
						p={2}
						maxH="70vh"
						overflow="auto"
						marginBottom="60px"
					>
						{Object.entries(wordStore)
							.filter(([_, word]) => !(hideAutoFillWords && word.isAutoFill))
							.map(([nodeKey, node]) => (
								<Word
									border
									key={nodeKey}
									wordId={node.wordId}
									wordKey={nodeKey}
									clickHandler={() => highlightWord(nodeKey)}
								/>
							))}
					</Box>
					<Box
						pos="absolute"
						bottom="0"
						w="100%"
						bg="white"
						px={4}
						borderTopWidth="1px"
						borderTopColor="text.100"
						borderRadius="0px 0px 3px 3px"
					>
						<FormControl
							display="flex"
							alignItems="center"
							my={4}
							justifyContent="space-between"
						>
							<FormLabel
								htmlFor="hide-auto-fill-words"
								mb="0"
								display="flex"
								gap={2}
								alignItems="center"
							>
								<IoLanguageOutline size={16} color={text400} />
								<Text
									textTransform="uppercase"
									fontWeight="500"
									fontSize="14"
									color="text.300"
								>
									Hide Autofill Words
								</Text>
							</FormLabel>
							<Switch
								colorScheme="brand"
								id="hide-auto-fill-words"
								isChecked={hideAutoFillWords}
								onChange={(e) => setHideAutoFillWords(e.target.checked)}
							/>
						</FormControl>
					</Box>
				</FloatingContainer>
			</div>
		</>
	);
};

export default WordList;
