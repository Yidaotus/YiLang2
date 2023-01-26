import type { Middleware } from "@floating-ui/dom";
import type { ReferenceType } from "@floating-ui/react";

import { Box, Button, IconButton, Text, useToken } from "@chakra-ui/react";
import { HIGHLIGHT_NODE_COMMAND } from "@components/Editor/Editor";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useOutlineSentences } from "@store/outline";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { useRef, useState } from "react";
import { IoAlbumsOutline } from "react-icons/io5";

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

const SentenceList = () => {
	const [text400] = useToken("colors", ["text.400"]);
	const [editor] = useLexicalComposerContext();
	const sentences = useOutlineSentences();

	const buttonRef = useRef(null);
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const floatingRef = useRef(null);
	useOnClickOutside(floatingRef, () => {
		setPopupReference(null);
	});

	return (
		<>
			<IconButton
				icon={<IoAlbumsOutline size={20} color={text400} />}
				gridColumn="span 2"
				variant={!!popupReference ? "solid" : "ghost"}
				aria-label="Appereance"
				color="text.400"
				disabled={Object.entries(sentences).length < 1}
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
						w="450px"
						p={2}
						maxH="70vh"
						overflow="auto"
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
						{Object.entries(sentences).map(([nodeKey, node]) => (
							<Box
								key={nodeKey}
								display="flex"
								flexDir="column"
								overflow="hidden"
								whiteSpace="nowrap"
								textOverflow="ellipsis"
							>
								<Button
									fontWeight="normal"
									textAlign="left"
									alignSelf="flex-start"
									variant="link"
									onClick={() =>
										editor.dispatchCommand(HIGHLIGHT_NODE_COMMAND, nodeKey)
									}
								>
									<Text
										color={
											node.isDeleted
												? "red.300"
												: node.isDirty
												? "green.200"
												: "text.400"
										}
									>
										{node.sentence}
									</Text>
								</Button>
								<Text color="text.300" fontSize="0.9em">
									{`${node.translation} / ${node.containingWords.length} Words`}
								</Text>
							</Box>
						))}
					</Box>
				</FloatingContainer>
			</div>
		</>
	);
};

export default SentenceList;
