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
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import Word from "@components/Word";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useOutlineStore from "@store/outline";
import useEditorStore from "@store/store";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { $createNodeSelection, $setSelection, LineBreakNode } from "lexical";
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
	const previousTargetWordId = useRef<typeof targetWordId>();
	const words = useOutlineStore((store) => store.words);
	const { hideAutoFillWords, setHideAutoFillWords } = useEditorStore(
		(state) => ({
			hideAutoFillWords: state.editorHideAutoFillWords,
			setHideAutoFillWords: state.setEditorHideAutoFillWords,
		}),
		shallow
	);
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
		if (targetWordId && targetWordId !== previousTargetWordId.current) {
			const targetInStore = Object.entries(words).find(
				([_, node]) => targetWordId === node.wordId
			);
			if (targetInStore) {
				highlightWord(targetInStore[0]);
				previousTargetWordId.current = targetWordId;
			}
		}
	}, [highlightWord, previousTargetWordId, targetWordId, words]);

	return (
		<>
			<Button
				leftIcon={<IoLanguageOutline size={20} color={text400} />}
				gridColumn="span 2"
				variant={!!popupReference ? "solid" : "ghost"}
				aria-label="Appereance"
				color="text.400"
				disabled={Object.entries(words).length < 1}
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
						w="350px"
						p={2}
						maxH="70vh"
						overflow="auto"
						marginBottom="60px"
					>
						{Object.entries(words)
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
