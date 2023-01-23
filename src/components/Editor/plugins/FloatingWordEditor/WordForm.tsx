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
	Switch,
	Text,
} from "@chakra-ui/react";
import YiSimpleCreatableSelect from "@components/CreatableSelect/CreatableSelect";
import useDebounce from "@components/Editor/hooks/useDebounce";
import type { Tag, Word } from "@prisma/client";
import useEditorSettingsStore from "@store/store";
import { trpc } from "@utils/trpc";
import type { ActionMeta, InputActionMeta } from "chakra-react-select";
import { CreatableSelect } from "chakra-react-select";
import React, { useCallback, useEffect, useState } from "react";
import type { RefCallBack } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import {
	IoAttachOutline,
	IoCloud,
	IoGitBranchOutline,
	IoLanguageOutline,
	IoPricetagsOutline,
} from "react-icons/io5";
import { RiDeleteBin2Line } from "react-icons/ri";

type WordWithTags = Word & { tags: Array<Tag> };

const isWordWithTags = <T,>(input: WordWithTags | T): input is WordWithTags => {
	return (input as WordWithTags).word !== undefined;
};

export interface WordOption {
	readonly value: string;
	readonly label: string;
	readonly word: WordWithTags | null;
}

type WordSelectProps = {
	value: WordWithTags | string | null;
	onChange: (newWord: WordWithTags | string | null) => void;
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
	const selectValue =
		value === null
			? value
			: typeof value === "string"
			? { label: value, value: "new", word: null }
			: { label: value.word, value: value.id, word: value };

	const handleInputChange = (inputText: string, _event: InputActionMeta) => {
		// prevent outside click from resetting inputText to ""
		// if (event.action !== "input-blur" && event.action !== "menu-close") {
		// }
		setSearchInput(inputText);
	};

	const handleChange = (
		selectedItem: WordOption | null,
		_event: ActionMeta<WordOption | null>
	) => {
		console.debug({ selectedItem });
		if (!selectedItem) {
			onChange(selectedItem);
			return;
		}

		if (selectedItem.word) {
			onChange(selectedItem.word);
		} else {
			onChange(selectedItem.label);
		}
	};

	return (
		<CreatableSelect<WordOption, false>
			ref={ref}
			value={selectValue}
			options={searchWordResult?.map((word) => ({
				label: word.word,
				value: word.id,
				word,
			}))}
			inputValue={searchInput}
			onChange={handleChange}
			isLoading={wordSearchIsLoading}
			onInputChange={handleInputChange}
			onCreateOption={(input) => {
				onChange(input);
			}}
			components={{
				Option: ({ children, innerProps }) => (
					<Box
						as="div"
						color="text.400"
						display="flex"
						alignItems="center"
						cursor="pointer"
						py={1}
						w="100%"
						pl={2}
						sx={{
							"&:hover": {
								bg: "#f4f4f4",
							},
						}}
						{...innerProps}
					>
						{children}
					</Box>
				),
			}}
			chakraStyles={{
				control: (prev) => ({
					...prev,
					borderRadius: "2px",
				}),
				container: (prev) => ({
					...prev,
					bg: "#fafaf9",
					borderRadius: "2px",
				}),
				menuList: (prev) => ({
					...prev,
					borderRadius: "2px",
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
		/>
	);
};

const WordSelect = React.forwardRef(WordSelectComponent);

export type WordFormType = {
	root: WordWithTags | string | null;
	word: string;
	translations: Array<string>;
	spelling?: string;
	notes?: string;
	tags: Array<EditorTag>;
	relatedTo: Word;
	variationTags?: Array<EditorTag>;
	variationSpelling?: string;
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
		watch,
		formState: { errors },
	} = useForm<WordFormType>({
		defaultValues: {
			root: null,
			variationSpelling: "",
			variationTags: [],
			word,
			translations: [],
			spelling: "",
			tags: [],
			notes: "",
		},
	});

	const selectedRoot = watch("root");

	useEffect(() => {
		if (selectedRoot && typeof selectedRoot === "object") {
			setValue("spelling", selectedRoot.spelling || undefined);
			setValue("tags", selectedRoot.tags);
			setValue("translations", selectedRoot.translation?.split(";"));
		}
	}, [selectedRoot, setValue]);

	const [isVariation, setIsVariation] = useState(false);

	const switchIsVariation = useCallback(() => {
		setIsVariation(!isVariation);
		setValue("root", null);
		setValue("spelling", "");
		setValue("tags", []);
		setValue("translations", []);
	}, [isVariation, setValue]);

	const hasSelectedRoot = isVariation && typeof selectedRoot === "object";

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
				{isVariation && (
					<Box
						display="flex"
						gap={2}
						justifyContent="center"
						alignItems="center"
					>
						<IoGitBranchOutline />
						<FormControl isInvalid={!!errors.root}>
							<FormLabel
								display="none"
								htmlFor="root"
								color="text.400"
								fontSize="0.9em"
								mb="0px"
							>
								Root
							</FormLabel>
							<Controller
								control={control}
								name="root"
								rules={{
									required: "Please enter at least one translation",
									min: "Please enter at least one translation",
								}}
								render={({ field: { onChange, value, ref } }) => (
									<WordSelect onChange={onChange} value={value} ref={ref} />
								)}
							/>
							<FormErrorMessage>
								{errors.root && errors.root.message}
							</FormErrorMessage>
						</FormControl>
					</Box>
				)}
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
							disabled={hasSelectedRoot}
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
									disabled={hasSelectedRoot}
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
									isDisabled={hasSelectedRoot}
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
				{isVariation && (
					<>
						<Divider />
						<Box
							display="flex"
							gap={2}
							justifyContent="center"
							alignItems="center"
						>
							<IoAttachOutline height="100%" />
							<FormControl isInvalid={!!errors.variationSpelling}>
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
									{...register("variationSpelling")}
								/>
								<FormErrorMessage>
									{errors.variationSpelling && errors.variationSpelling.message}
								</FormErrorMessage>
							</FormControl>
						</Box>{" "}
						<Box
							display="flex"
							gap={2}
							justifyContent="center"
							alignItems="center"
						>
							<IoPricetagsOutline />
							<FormControl isInvalid={!!errors.variationTags}>
								<FormLabel
									display="none"
									htmlFor="variationTags"
									color="text.400"
									fontSize="0.9em"
									mb="0px"
								>
									Tags
								</FormLabel>
								<Controller
									control={control}
									name="variationTags"
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
													setTagOptions([
														...(value ? value : []),
														...tagOptions,
														newTag,
													]);
													onChange([...(value ? value : []), newTag]);
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
									{errors.variationTags && errors.variationTags.message}
								</FormErrorMessage>
							</FormControl>
						</Box>
					</>
				)}
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
				<Box display="flex" alignItems="center" justifyContent="center" px={2}>
					<FormControl
						display="flex"
						alignItems="center"
						justifyContent="space-between"
					>
						<FormLabel
							htmlFor="save-on-blu"
							mb="0"
							display="flex"
							gap={2}
							alignItems="center"
						>
							<Text fontWeight="500" color="text.300">
								Is Variation
							</Text>
						</FormLabel>
						<Switch
							colorScheme="brand"
							id="save-on-blu"
							isChecked={isVariation}
							onChange={switchIsVariation}
						/>
					</FormControl>
				</Box>
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
