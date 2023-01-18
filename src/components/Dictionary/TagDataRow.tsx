import type { ReferenceType } from "@floating-ui/react";
import type { Tag } from "@prisma/client";
import type { RouterTypes } from "@utils/trpc";

import { Box, Text } from "@chakra-ui/react";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { trpc } from "@utils/trpc";
import { CreatableSelect } from "chakra-react-select";
import { useCallback, useRef, useState } from "react";
import { IoPricetagsOutline } from "react-icons/io5";
import { RiCloseLine } from "react-icons/ri";
import { RxPlus } from "react-icons/rx";
import DataRow from "./DataRow";

type TagDataRowProps = {
	languageId: string;
	tags: Exclude<
		RouterTypes["dictionary"]["word"]["get"]["output"],
		null
	>["tags"];
	linkNewTag: (tagId: string) => void;
	removeTag: (tagId: string) => void;
};
const TagDataRow = ({
	tags,
	linkNewTag,
	removeTag,
	languageId,
}: TagDataRowProps) => {
	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);
	const allTags = trpc.dictionary.tag.getAll.useQuery({
		language: languageId,
	});
	const floatingRef = useRef(null);
	const inputRef = useRef(null);

	useOnClickOutside(inputRef, () => {
		setPopupReference(null);
	});

	const addTag = useCallback(
		(tag: Tag) => {
			linkNewTag(tag.id);
		},
		[linkNewTag]
	);

	const handleRemoveTag = useCallback(
		(tag: Tag) => {
			removeTag(tag.id);
		},
		[removeTag]
	);

	const showInputPopup = useCallback(() => {
		setPopupReference(floatingRef.current);
	}, []);

	return (
		<>
			<FloatingContainer
				popupPlacement="bottom"
				popupReference={popupReference}
				showArrow
			>
				<Box ref={inputRef}>
					<CreatableSelect
						size="md"
						focusBorderColor="none"
						value={[] as Tag[]}
						onChange={(newValue) => {
							setPopupReference(null);
							const newValueItem = newValue[0];
							if (newValueItem) {
								addTag(newValueItem);
							}
						}}
						chakraStyles={{
							container: (prev) => ({
								...prev,
								borderRadius: "5px",
								bg: "#fafaf9",
								w: "250px",
								_focus: {
									border: "none",
								},
							}),
							multiValue: (prev, state) => ({
								...prev,
								justifyContent: "center",
								alignItems: "center",
								borderColor: "text.100",
								bg: "#F5F5F5",
								borderWidth: "1px",
								"&::before": {
									content: '""',
									bg: state.data.color,
									h: "10px",
									w: "5px",
									pr: 2,
									mr: 2,
									borderRadius: "1em",
									border: `1px solid ${state.data.color}`,
								},
							}),
							indicatorSeparator: (prev) => ({
								...prev,
								borderLeft: "1px solid text.100",
								height: "60%",
							}),
							dropdownIndicator: (prev) => ({
								...prev,
								w: "10px",
								bg: "#FCFCFB",
							}),
							placeholder: (prev) => ({
								...prev,
								color: "text.200",
							}),
						}}
						placeholder="Tags"
						isMulti
						options={allTags.data || []}
						getOptionValue={(o) => o.name}
						getOptionLabel={(o) => o.name}
						components={{
							Option: ({ children, data, innerProps }) => (
								<Box
									as="div"
									sx={{
										color: "text.400",
										display: "flex",
										alignItems: "center",
										cursor: "pointer",
										py: 1,
										w: "100%",
										"&:hover": {
											bg: "#f4f4f4",
										},
									}}
									{...innerProps}
								>
									<Box
										sx={{
											w: "12px",
											h: "12px",
											ml: 1,
											mr: 2,
											borderRadius: "4px",
											border: `2px solid ${data.color}`,
											bg: data.color,
										}}
									/>
									{children}
								</Box>
							),
						}}
					/>
				</Box>
			</FloatingContainer>
			<DataRow
				title={
					<Box display="flex" gap={1} alignItems="center">
						<IoPricetagsOutline />
						Tags
					</Box>
				}
				value={
					<Box display="flex" gap={2} flexWrap="wrap">
						{tags.map((tag) => (
							<Box
								key={tag.id}
								bg={`${tag.color}55`}
								borderRadius="4px"
								color="text.500"
								display="flex"
								flexWrap="nowrap"
								alignItems="center"
								gap={1}
								pl={2}
							>
								<Text>{tag.name}</Text>
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
									onClick={() => handleRemoveTag(tag)}
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
							ref={floatingRef}
							onClick={showInputPopup}
						>
							<RxPlus />
						</Box>
					</Box>
				}
			/>
		</>
	);
};

export default TagDataRow;
