import { Box } from "@chakra-ui/react";

type DataRowProps = {
	alignTop?: boolean;
	title: React.ReactNode;
	value: React.ReactNode;
};

const DataRow = ({ title, value, alignTop = false }: DataRowProps) => (
	<Box
		display="flex"
		gap={[1, null, 8]}
		flexDirection={["column", null, "row"]}
	>
		<Box
			w={["100%", null, "30%"]}
			display="flex"
			alignItems={["flex-start", null, "flex-end"]}
			justifyContent={alignTop ? "flex-start" : "center"}
			flexDir="column"
			color="text.300"
			gap="9px"
		>
			<Box>{title}</Box>
		</Box>
		<Box
			w={["100%", null, "70%"]}
			display="flex"
			alignItems="flex-start"
			justifyContent="center"
			flexDir="column"
			gap={2}
		>
			{value}
		</Box>
	</Box>
);

export default DataRow;
