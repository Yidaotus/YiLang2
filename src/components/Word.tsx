import { trpc } from "@utils/trpc";
import { Box } from "@chakra-ui/react";
import { IoChatboxEllipses } from "react-icons/io5";

type WordProps = {
	id: string;
	border?: boolean;
};
const Word = ({ id, border = false }: WordProps) => {
	const dbWord = trpc.dictionary.getWord.useQuery(id);

	const borderStyle = border
		? { borderColor: "text.100", borderWidth: "1px", borderRadius: "5px" }
		: {};

	return (
		<Box sx={{ ...borderStyle }}>
			{dbWord.data && (
				<>
					<Box sx={{ display: "flex", flexDir: "column" }} p={2}>
						<Box fontSize="1.4em" color="text.500">
							{dbWord.data.word}
						</Box>
						{dbWord.data.spelling && (
							<Box fontSize="0.8em" color="text.300" flexGrow="1">
								{dbWord.data.spelling}
							</Box>
						)}
						<Box display="flex" alignItems="center">
							<Box fontSize="1em" color="text.400" flexGrow="1">
								{dbWord.data.translations.join(", ")}
							</Box>
							<Box display="flex" pl={6} gap={1}>
								{dbWord.data.tags.map((t) => (
									<Box
										key={t.tagId}
										borderRadius="100%"
										border={`5px solid ${t.tag.color}`}
									/>
								))}
							</Box>
						</Box>
					</Box>
					{dbWord.data.comment && (
						<Box
							bg="text.100"
							color="text.400"
							pl={4}
							pr={2}
							py={1}
							borderRadius="0px 0px 4px 4px"
							fontSize="0.9em"
							alignItems="center"
							gap={2}
							display="flex"
							borderColor="text.100"
							borderWidth="1px 0px 0px 0px"
							pos="relative"
							zIndex={30}
						>
							<IoChatboxEllipses color="text.400" size="18" />
							{dbWord.data.comment}
						</Box>
					)}
				</>
			)}
		</Box>
	);
};

export default Word;
