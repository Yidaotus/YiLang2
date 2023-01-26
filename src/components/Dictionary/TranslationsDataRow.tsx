import {
	Box,
	ButtonGroup,
	IconButton,
	Input,
	InputGroup,
	InputRightElement,
	Text,
	useToken,
} from "@chakra-ui/react";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import type { ReferenceType } from "@floating-ui/react";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import type { RouterTypes } from "@utils/trpc";
import { useCallback, useRef, useState } from "react";
import { IoSaveOutline } from "react-icons/io5";
import { RiAddLine, RiCloseLine, RiTranslate } from "react-icons/ri";
import DataRow from "./DataRow";

type TranslationsDataRowProps = {
	translations: Exclude<
		RouterTypes["dictionary"]["word"]["get"]["output"],
		null
	>["translations"];
	removeTranslation: (spellingToRemove: string) => void;
	addTranslation: (newSpelling: string) => void;
};
const TranslationsDataRow = ({
	translations,
	removeTranslation,
	addTranslation,
}: TranslationsDataRowProps) => {
	const [translationInput, setTranslationInput] = useState("");
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const floatingRef = useRef(null);
	const inputGroupRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [iconColor] = useToken("colors", ["text.400"]);

	useOnClickOutside(inputGroupRef, () => {
		setPopupReference(null);
	});

	const addTranslationFromInput = useCallback(() => {
		addTranslation(translationInput);
		setTranslationInput("");
		setPopupReference(null);
	}, [addTranslation, translationInput]);

	const showInputPopup = useCallback(() => {
		setPopupReference(floatingRef.current);
		inputRef.current?.focus();
	}, []);

	const handleInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				addTranslationFromInput();
			}
		},
		[addTranslationFromInput]
	);

	return (
		<>
			<FloatingContainer
				popupPlacement="bottom"
				popupReference={popupReference}
				showArrow
			>
				<InputGroup
					size="md"
					width={["90%", null, "400px"]}
					ref={inputGroupRef}
				>
					<Input
						pr="4.5rem"
						size="md"
						autoFocus
						value={translationInput}
						onKeyDown={handleInputKeyDown}
						onChange={(e) => setTranslationInput(e.target.value)}
						ref={inputRef}
						border="none"
						focusBorderColor="none"
					/>
					<InputRightElement width="5.5rem">
						<Box borderLeftWidth="1px" borderColor="text.100" h="60%" />
						<ButtonGroup isAttached>
							<IconButton
								variant="ghost"
								colorScheme="brand"
								h="2.1rem"
								size="md"
								aria-label="Add Translation"
								icon={<IoSaveOutline color={iconColor} />}
								onClick={addTranslationFromInput}
							/>
							<IconButton
								variant="ghost"
								colorScheme="brand"
								h="2.1rem"
								size="md"
								aria-label="Add Translation"
								icon={<RiCloseLine color={iconColor} />}
								onClick={() => setPopupReference(null)}
							/>
						</ButtonGroup>
					</InputRightElement>
				</InputGroup>
			</FloatingContainer>
			<DataRow
				title={
					<Box display="flex" gap={1} alignItems="center">
						<RiTranslate />
						Translation
					</Box>
				}
				value={
					<Box display="flex" gap={2}>
						{translations.map((translation) => (
							<Box
								key={translation}
								borderRadius="4px"
								borderWidth="1px"
								borderColor="text.100"
								color="text.400"
								display="flex"
								flexWrap="nowrap"
								alignItems="center"
								gap={1}
								pl={2}
							>
								<Text fontSize="0.95em">{translation}</Text>
								<Box
									as="button"
									h="100%"
									borderRightRadius="4px"
									display="flex"
									alignItems="center"
									px={1}
									sx={{
										"& svg": {
											color: "text.400",
										},
										"&:hover": {
											"& svg": {
												color: "white",
											},
											bg: "#BD4C50",
										},
									}}
									onClick={() => removeTranslation(translation)}
								>
									<RiCloseLine />
								</Box>
							</Box>
						))}
						<Box
							bg="text.100"
							borderRadius="4px"
							color="text.500"
							display="flex"
							flexWrap="nowrap"
							alignItems="center"
							justifyContent="center"
							p={1}
							as="button"
							_hover={{
								bg: "text.200",
							}}
							onClick={showInputPopup}
							ref={floatingRef}
						>
							<RiAddLine />
						</Box>
					</Box>
				}
			/>
		</>
	);
};

export default TranslationsDataRow;
