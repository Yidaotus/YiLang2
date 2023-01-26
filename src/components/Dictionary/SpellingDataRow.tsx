import type { RouterTypes } from "@utils/trpc";

import {
	Box,
	ButtonGroup,
	IconButton,
	Input,
	InputGroup,
	InputRightElement,
	useToken,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { IoSaveOutline } from "react-icons/io5";
import { RiCloseLine, RiTranslate2 } from "react-icons/ri";
import { RxPencil1 } from "react-icons/rx";
import DataRow from "./DataRow";
type SpellingDataRowProps = {
	spelling: Exclude<
		RouterTypes["dictionary"]["word"]["get"]["output"],
		null
	>["spelling"];
	updateSpelling: (newSpelling: string) => void;
};
const SpellingDataRow = ({
	spelling,
	updateSpelling,
}: SpellingDataRowProps) => {
	const [isEditingSpelling, setIsEditingSpelling] = useState(false);
	const [spellingInput, setSpellingInput] = useState(spelling || "");
	const [iconActive] = useToken("colors", ["text.400"]);

	const saveSpelling = useCallback(() => {
		setIsEditingSpelling(false);
		if (spellingInput && spelling !== spellingInput) {
			updateSpelling(spellingInput);
			//updateWord.mutate({ id: dbWord.data.id, spelling: spellingInput });
		}
	}, [spelling, spellingInput, updateSpelling]);

	return (
		<DataRow
			title={
				<Box display="flex" gap={1} alignItems="center">
					<RiTranslate2 />
					Spelling
				</Box>
			}
			value={
				isEditingSpelling ? (
					<InputGroup size="md" width={["90%", null, "400px"]}>
						<Input
							focusBorderColor="none"
							pr="4.5rem"
							size="md"
							value={spellingInput}
							onChange={(e) => setSpellingInput(e.target.value)}
							autoFocus
						/>
						<InputRightElement width="5.5rem">
							<Box borderLeftWidth="1px" borderColor="text.100" h="60%" />
							<ButtonGroup isAttached>
								<IconButton
									variant="ghost"
									colorScheme="brand"
									h="2.1rem"
									size="md"
									onClick={saveSpelling}
									aria-label="Add Translation"
									icon={<IoSaveOutline color={iconActive} />}
								/>
								<IconButton
									variant="ghost"
									colorScheme="brand"
									h="2.1rem"
									size="md"
									onClick={() => setIsEditingSpelling(false)}
									aria-label="Add Translation"
									icon={<RiCloseLine color={iconActive} />}
								/>
							</ButtonGroup>
						</InputRightElement>
					</InputGroup>
				) : (
					<Box color="text.400" display="flex" gap={2}>
						{spelling}

						<Box
							bg="text.100"
							borderRadius="4px"
							color="text.500"
							display="flex"
							flexWrap="nowrap"
							alignItems="center"
							justifyContent="center"
							px={2}
							py={1}
							as="button"
							_hover={{
								bg: "text.200",
							}}
							onClick={() => setIsEditingSpelling(true)}
						>
							<RxPencil1 />
						</Box>
					</Box>
				)
			}
		/>
	);
};

export default SpellingDataRow;
