import { Box, Link } from "@chakra-ui/react";
import { trpc } from "@utils/trpc";
import { IoChatboxEllipses } from "react-icons/io5";

type WordProps = {
	databaseId: string;
	nodeKey?: string;
	border?: boolean;
	clickHandler?: ({
		nodeKey,
		databaseId,
	}: {
		nodeKey?: string;
		databaseId: string;
	}) => void;
};
const Word = ({
	nodeKey,
	databaseId,
	border = false,
	clickHandler,
}: WordProps) => {
	const dbWord = trpc.dictionary.word.get.useQuery({ id: databaseId });

	const borderStyle = border
		? { borderColor: "text.100", borderWidth: "1px", borderRadius: "5px" }
		: {};

	return (
		<Box sx={{ ...borderStyle }}>
			{dbWord.data && (
				<>
					<Box sx={{ display: "flex", flexDir: "column" }} p={2}>
						{!!clickHandler ? (
							<Link
								onClick={() => clickHandler({ nodeKey, databaseId })}
								fontSize="1.2em"
								color="text.500"
							>
								{dbWord.data.word}
							</Link>
						) : (
							<Box fontSize="1.2em" color="text.500">
								{dbWord.data.word}
							</Box>
						)}
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
										key={t.id}
										borderRadius="100%"
										border={`5px solid ${t.color}`}
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
