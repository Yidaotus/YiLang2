import type { EditorTag } from "@components/Editor/nodes/WordNode";

import {
	Box,
	Button,
	FormControl,
	FormErrorMessage,
	FormLabel,
	IconButton,
	Input,
	Stack,
	Textarea,
} from "@chakra-ui/react";
import YiSimpleCreatableSelect from "@components/CreatableSelect/CreatableSelect";
import { CreatableSelect } from "chakra-react-select";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { IoSave } from "react-icons/io5";
import { RxTrash } from "react-icons/rx";

export type WordFormType = {
	word: string;
	translations: Array<string>;
	spelling?: string;
	comment?: string;
	tags: Array<EditorTag>;
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
			comment: "",
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
		<div>
			<form action="" className="flex flex-col gap-2" onSubmit={onSubmit}>
				<Stack>
					<FormControl isInvalid={!!errors.translations}>
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
								bg: "#fafaf9",
							}}
							id="spelling"
							size="md"
							placeholder="Spelling"
							{...register("spelling")}
						/>
						<FormErrorMessage>
							{errors.spelling && errors.spelling.message}
						</FormErrorMessage>
					</FormControl>
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
									size="md"
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
										name: `Create ${input} tag...`,
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
												sx={{
													color: "text.400",
													display: "flex",
													alignItems: "center",
													cursor: "pointer",
													py: 1,
													fontSize: "16px",
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
							)}
						/>
						<FormErrorMessage>
							{errors.spelling && errors.spelling.message}
						</FormErrorMessage>
					</FormControl>
					<FormControl isInvalid={!!errors.comment}>
						<FormLabel
							display="none"
							htmlFor="comment"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
						>
							Comment
						</FormLabel>
						<Textarea
							sx={{
								"&::placeholder": {
									color: "text.200",
								},
								bg: "#fafaf9",
							}}
							id="comment"
							size="md"
							placeholder="Comment"
							{...register("comment")}
						/>
						<FormErrorMessage>
							{errors.comment && errors.comment.message}
						</FormErrorMessage>
					</FormControl>
					<Box
						sx={{
							pt: 2,
							w: "100%",
						}}
						display="flex"
						justifyContent="space-between"
					>
						<IconButton
							aria-label="cancel"
							icon={<RxTrash />}
							onClick={cancel}
						/>
						<Button
							bg="brand.500"
							color="#FFFFFF"
							variant="solid"
							type="submit"
							rightIcon={<IoSave />}
							sx={{
								"&:hover": {
									bg: "brand.700",
								},
							}}
						>
							Submit
						</Button>
					</Box>
				</Stack>
			</form>
		</div>
	);
};

export default WordForm;
