import type { EditorTag } from "@components/Editor/nodes/WordNode";

import {
	Box,
	Button,
	Divider,
	FormControl,
	FormErrorMessage,
	FormLabel,
	IconButton,
	Input,
	Stack,
	Textarea,
} from "@chakra-ui/react";
import YiSimpleCreatableSelect from "@components/CreatableSelect/CreatableSelect";
import useDebounce from "@components/Editor/hooks/useDebounce";
import type { Word } from "@prisma/client";
import useEditorSettingsStore from "@store/store";
import { trpc } from "@utils/trpc";
import type { ActionMeta, InputActionMeta } from "chakra-react-select";
import { CreatableSelect, Select } from "chakra-react-select";
import React, { useCallback, useEffect, useState } from "react";
import type { RefCallBack } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import {
	IoAttachOutline,
	IoCloud,
	IoDocumentTextOutline,
	IoGitBranchOutline,
	IoLanguageOutline,
	IoPricetagsOutline,
} from "react-icons/io5";
import { RiDeleteBin2Line } from "react-icons/ri";

type WordSelectProps = {
	value: Word | null;
	onChange: (newWord: Word | null) => void;
	ref: RefCallBack;
};
const WordSelectComponent = ({ value, onChange, ref }: WordSelectProps) => {
	const [searchInput, setSearchInput] = useState("");
	const debouncedSearchInput = useDebounce(searchInput);
	const activeLanguage = useEditorSettingsStore(
		(store) => store.selectedLanguage
	);
	const searchEnabled = debouncedSearchInput.length > 0;
	const { status: searchStatus, data: searchWordResult } =
		trpc.dictionary.word.search.useQuery(
			{
				languageId: activeLanguage.id,
				search: debouncedSearchInput,
			},
			{ enabled: searchEnabled }
		);
	// see https://github.com/TanStack/query/issues/3584
	const wordSearchIsLoading = searchEnabled && searchStatus === "loading";

	const handleInputChange = (inputText: string, _event: InputActionMeta) => {
		// prevent outside click from resetting inputText to ""
		// if (event.action !== "input-blur" && event.action !== "menu-close") {
		// }
		setSearchInput(inputText);
	};

	const handleChange = (
		selectedItem: Word | null,
		_event: ActionMeta<Word>
	) => {
		onChange(selectedItem);
	};

	return (
		<Select
			ref={ref}
			value={value}
			getOptionLabel={(word) => word.word}
			options={searchWordResult}
			inputValue={searchInput || ""}
			onChange={handleChange}
			isLoading={wordSearchIsLoading}
			onInputChange={handleInputChange}
		/>
	);
};

const WordSelect = React.forwardRef(WordSelectComponent);

export type WordFormType = {
	word: string;
	translations: Array<string>;
	spelling?: string;
	notes?: string;
	tags: Array<EditorTag>;
	relatedTo: Word;
};

const WordForm = ({
	word,
	showTagEditor,
	resolveWord,
	dbTags,
}: {
	word: string;
	showTagEditor: (newTagName: string) => Promise<EditorTag | null>;
	resolveWord: (newWord: WordFormType | null) => void;
	dbTags: Array<EditorTag>;
}) => {
	const {
		handleSubmit,
		control,
		register,
		reset,
		setValue,
		formState: { errors },
	} = useForm<WordFormType>({
		defaultValues: {
			word,
			translations: [],
			spelling: "",
			tags: [],
			notes: "",
		},
	});

	useEffect(() => {
		setValue("word", word);
	}, [setValue, word]);

	const [tagOptions, setTagOptions] = useState<Array<EditorTag>>(dbTags);

	const onSubmit = handleSubmit((data) => {
		reset();
		resolveWord(data);
	});

	const cancel = useCallback(() => {
		reset();
		resolveWord(null);
	}, [reset, resolveWord]);

	const createNewTag = useCallback(
		async (newTagName: string) => {
			const getNewTag = await showTagEditor(newTagName);
			return getNewTag;
		},
		[showTagEditor]
	);

	return (
		<form action="" onSubmit={onSubmit}>
			<Stack p={2}>
				<Box display="flex" gap={2} justifyContent="center" alignItems="center">
					<IoLanguageOutline />
					<FormControl isInvalid={!!errors.translations} size="sm">
						<FormLabel
							display="none"
							htmlFor="translations"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
						>
							Translation(s)
						</FormLabel>
						<Controller
							control={control}
							name="translations"
							rules={{
								required: "Please enter at least one translation",
								min: "Please enter at least one translation",
							}}
							render={({ field: { onChange, value, ref } }) => (
								<YiSimpleCreatableSelect
									ref={ref}
									value={value}
									onChange={(val) => onChange(val)}
									placeholder="Translation(s)"
								/>
							)}
						/>
						<FormErrorMessage>
							{errors.translations && errors.translations.message}
						</FormErrorMessage>
					</FormControl>
				</Box>
				<Box display="flex" gap={2} justifyContent="center" alignItems="center">
					<IoAttachOutline height="100%" />
					<FormControl isInvalid={!!errors.spelling}>
						<FormLabel
							display="none"
							htmlFor="spelling"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
						>
							Spelling
						</FormLabel>

						<Input
							sx={{
								"&::placeholder": {
									color: "text.200",
								},
							}}
							bg="#fafaf9"
							id="spelling"
							size="sm"
							placeholder="Spelling"
							{...register("spelling")}
						/>
						<FormErrorMessage>
							{errors.spelling && errors.spelling.message}
						</FormErrorMessage>
					</FormControl>
				</Box>
				<Box display="flex" gap={2} justifyContent="center" alignItems="center">
					<IoPricetagsOutline />
					<FormControl isInvalid={!!errors.tags}>
						<FormLabel
							display="none"
							htmlFor="tags"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
						>
							Tags
						</FormLabel>
						<Controller
							control={control}
							name="tags"
							render={({ field: { onChange, value, ref } }) => (
								<CreatableSelect
									ref={ref}
									size="sm"
									value={value}
									onChange={(val) => onChange(val)}
									chakraStyles={{
										container: (prev) => ({
											...prev,
											borderRadius: "5px",
											bg: "#fafaf9",
										}),
										multiValue: (prev, state) => ({
											...prev,
											justifyContent: "center",
											alignItems: "center",
											borderColor: "text.100",
											bg: "#F5F5F5",
											borderWidth: "1px",
											fontSize: "0.9em",
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
									options={tagOptions}
									getOptionValue={(o) => o.name}
									getOptionLabel={(o) => o.name}
									getNewOptionData={(input) => ({
										name: `Create ${input} tag`,
										color: "",
									})}
									onCreateOption={async (newOpt) => {
										const newTag = await createNewTag(newOpt);
										if (newTag) {
											setTagOptions([...value, ...tagOptions, newTag]);
											onChange([...value, newTag]);
										}
									}}
									components={{
										Option: ({ children, data, innerProps }) => (
											<Box
												as="div"
												color="text.400"
												display="flex"
												alignItems="center"
												cursor="pointer"
												py={1}
												w="100%"
												sx={{
													"&:hover": {
														bg: "#f4f4f4",
													},
												}}
												{...innerProps}
											>
												<Box
													w="12px"
													h="12px"
													ml={1}
													mr={2}
													borderRadius="4px"
													border={`2px solid ${data.color}`}
													bg={data.color}
												/>
												{children}
											</Box>
										),
									}}
								/>
							)}
						/>
						<FormErrorMessage>
							{errors.spelling && errors.spelling.message}
						</FormErrorMessage>
					</FormControl>
				</Box>
				<Box
					display="flex"
					gap={2}
					justifyContent="flex-start"
					alignItems="flex-start"
				>
					<Box pt={2}>
						<IoDocumentTextOutline />
					</Box>
					<FormControl isInvalid={!!errors.notes}>
						<FormLabel
							display="none"
							htmlFor="notes"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
						>
							Notes
						</FormLabel>
						<Textarea
							sx={{
								"&::placeholder": {
									color: "text.200",
								},
							}}
							bg="#fafaf9"
							id="notes"
							size="sm"
							rows={2}
							placeholder="Notes"
							{...register("notes")}
						/>
						<FormErrorMessage>
							{errors.notes && errors.notes.message}
						</FormErrorMessage>
					</FormControl>
				</Box>
			</Stack>
			<Divider />
			<Box
				sx={{
					pt: 2,
					w: "100%",
				}}
				display="flex"
				justifyContent="space-between"
				p={2}
			>
				<Button
					size="sm"
					variant="outline"
					type="submit"
					leftIcon={<IoGitBranchOutline />}
				>
					Add Root
				</Button>
				<Stack direction="row">
					<IconButton
						aria-label="cancel"
						variant="outline"
						size="sm"
						icon={<RiDeleteBin2Line />}
						onClick={cancel}
					/>
					<Button
						size="sm"
						bg="brand.500"
						color="#FFFFFF"
						variant="solid"
						type="submit"
						leftIcon={<IoCloud />}
						sx={{
							"&:hover": {
								bg: "brand.700",
							},
						}}
					>
						Save Word
					</Button>
				</Stack>
			</Box>
		</form>
	);
};

export default WordForm;
