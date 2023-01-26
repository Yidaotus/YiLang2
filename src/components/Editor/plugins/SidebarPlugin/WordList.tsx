import type { Middleware } from "@floating-ui/dom";
import type { ReferenceType } from "@floating-ui/react";

import {
	Box,
	FormControl,
	FormLabel,
	IconButton,
	Switch,
	Text,
	useToken,
} from "@chakra-ui/react";
import { HIGHLIGHT_NODE_COMMAND } from "@components/Editor/Editor";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import Word from "@components/Word";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useOutlineWords } from "@store/outline";
import useEditorSettingsStore, { useEditorSettingsActions } from "@store/store";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { LineBreakNode } from "lexical";
import { useEffect, useRef, useState } from "react";
import { IoLanguageOutline } from "react-icons/io5";

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
	const words = useOutlineWords();
	const { setEditorHideAutoFillWords } = useEditorSettingsActions();
	const hideAutoFillWords = useEditorSettingsStore(
		(state) => state.editorHideAutoFillWords
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

	return (
		<>
			<IconButton
				icon={<IoLanguageOutline size={20} color={text400} />}
				gridColumn="span 2"
				variant={!!popupReference ? "solid" : "ghost"}
				aria-label="Appereance"
				color="text.400"
				disabled={Object.entries(words).length < 1}
				ref={buttonRef}
				onClick={() =>
					setPopupReference(popupReference ? null : buttonRef.current)
				}
			/>
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
						sx={{
							"&::-webkit-scrollbar": {
								width: "8px",
								height: "8px",
								backgroundColor: "white",
							},

							"&::-webkit-scrollbar-thumb": {
								background: "text.100",
								borderRadius: "3px",
							},
						}}
					>
						{Object.entries(words)
							.filter(([_, word]) => !(hideAutoFillWords && word.isAutoFill))
							.map(([nodeKey, node]) => (
								<Word
									border
									key={nodeKey}
									databaseId={node.databaseId}
									nodeKey={nodeKey}
									clickHandler={() =>
										editor.dispatchCommand(HIGHLIGHT_NODE_COMMAND, nodeKey)
									}
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
								onChange={(e) => setEditorHideAutoFillWords(e.target.checked)}
							/>
						</FormControl>
					</Box>
				</FloatingContainer>
			</div>
		</>
	);
};

export default WordList;
