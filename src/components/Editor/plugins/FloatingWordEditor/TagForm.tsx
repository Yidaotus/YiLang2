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
} from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
import { CirclePicker } from "react-color";
import { Controller, useForm } from "react-hook-form";
import { IoSave } from "react-icons/io5";
import { RxExit } from "react-icons/rx";

type TagFormType = {
	name: string;
	color: string;
};

const TagForm = ({
	resolveTag,
	name,
}: {
	resolveTag: (newTag: EditorTag | null) => void;
	name: string;
}) => {
	const {
		handleSubmit,
		register,
		reset,
		setValue,
		control,
		formState: { errors },
	} = useForm<TagFormType>({
		defaultValues: {
			name,
			color: "",
		},
	});

	useEffect(() => {
		setValue("name", name);
	}, [name, setValue]);

	const onSubmit = handleSubmit((data) => {
		reset();
		resolveTag(data);
	});

	const cancel = useCallback(() => {
		reset();
		resolveTag(null);
	}, [reset, resolveTag]);

	return (
		<div>
			<form action="" className="flex flex-col gap-2" onSubmit={onSubmit}>
				<Stack>
					<FormControl isInvalid={!!errors.name}>
						<FormLabel
							htmlFor="spelling"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
							display="none"
						>
							Name
						</FormLabel>
						<Input
							sx={{
								"&::placeholder": {
									color: "text.200",
								},
							}}
							id="name"
							bg="#FAFAF9"
							borderWidth={2}
							placeholder="Name"
							{...register("name", {
								required: "Please enter a name",
								minLength: {
									value: 2,
									message: "Minimum length should be 4",
								},
							})}
						/>
						<FormErrorMessage>
							{errors.name && errors.name.message}
						</FormErrorMessage>
					</FormControl>
					<FormControl
						isInvalid={!!errors.color}
						p={2}
						py={4}
						display="flex"
						justifyContent="center"
						borderRadius="5px"
						borderColor="text.100"
						borderWidth="2px"
						bg="#FAFAF9"
					>
						<FormLabel
							htmlFor="color"
							color="text.400"
							fontSize="0.9em"
							mb="0px"
							display="none"
						>
							Color
						</FormLabel>
						<Controller
							control={control}
							name="color"
							rules={{
								required: "Please enter at least one translation",
								min: "Please enter at least one translation",
							}}
							render={({ field: { onChange, value, ref } }) => (
								<CirclePicker
									color={value}
									onChange={(e) => onChange(e.hex)}
									ref={ref}
									circleSize={22}
									width="100%"
								/>
							)}
						/>
						<FormErrorMessage>
							{errors.color && errors.color.message}
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
							variant="ghost"
							onClick={cancel}
							aria-label="cancel"
							icon={<RxExit />}
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
							Create
						</Button>
					</Box>
				</Stack>
			</form>
		</div>
	);
};

export default TagForm;
