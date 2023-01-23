import { Box, Link, Stack, Text } from "@chakra-ui/react";
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
	const rootWord = trpc.dictionary.word.get.useQuery(
		{ id: dbWord.data?.rootId || "" },
		{ enabled: !!dbWord.data?.rootId }
	);

	const displayWord = (dbWord.data?.rootId && rootWord.data) || dbWord.data;

	const borderStyle = border
		? { borderColor: "text.100", borderWidth: "1px", borderRadius: "5px" }
		: {};

	return (
		<Box sx={{ ...borderStyle }}>
			{displayWord && (
				<>
					<Box sx={{ display: "flex", flexDir: "column" }} p={2}>
						<Box display="flex" justifyContent="space-between">
							{!!clickHandler ? (
								<Link
									onClick={() =>
										clickHandler({ nodeKey, databaseId: displayWord.id })
									}
									fontSize="1.2em"
									color="text.500"
								>
									{displayWord.word}
								</Link>
							) : (
								<Box fontSize="1.2em" color="text.500">
									{displayWord.word}
								</Box>
							)}
							<Box display="flex" pl={6} gap={1} alignItems="center">
								{displayWord.tags.map((t) => (
									<Box key={t.id} bg={t.color} borderRadius="2px" px={1}>
										<Text fontSize="0.8rem" color="white">
											{t.name}
										</Text>
									</Box>
								))}
							</Box>
						</Box>
						{displayWord.spelling && (
							<Box fontSize="0.8rem" color="text.300" flexGrow="1">
								{displayWord.spelling}
							</Box>
						)}
						<Box display="flex" alignItems="center">
							<Box fontSize="1em" color="text.400" flexGrow="1">
								{displayWord.translations.join(", ")}
							</Box>
						</Box>
					</Box>
					{displayWord.variations && displayWord.variations.length > 0 && (
						<Stack px={2} pb={2}>
							{displayWord.variations.map((variation) => (
								<Box
									display="flex"
									flexDirection="row"
									key={variation.id}
									justifyContent="space-between"
								>
									<Text color="text.300" fontSize="0.9em">
										{variation.word}
									</Text>
									<Box display="flex" pl={6} gap={1} alignItems="center">
										{variation.tags.map((t) => (
											<Box key={t.id} bg={t.color} borderRadius="2px" px={1}>
												<Text fontSize="0.8rem" color="white">
													{t.name}
												</Text>
											</Box>
										))}
									</Box>
								</Box>
							))}
						</Stack>
					)}
					{displayWord.comment && (
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
							{displayWord.comment}
						</Box>
					)}
				</>
			)}
		</Box>
	);
};

export default Word;
