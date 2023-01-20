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
} from "@chakra-ui/react";
import { useCallback, useEffect } from "react";
import { CirclePicker } from "react-color";
import { Controller, useForm } from "react-hook-form";
import {
	IoCloud,
	IoColorFillOutline,
	IoPricetagsOutline,
} from "react-icons/io5";
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
		<form action="" onSubmit={onSubmit}>
			<Stack p={2}>
				<Box display="flex" gap={2} justifyContent="center" alignItems="center">
					<IoPricetagsOutline />
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
							size="sm"
							id="name"
							bg="#FAFAF9"
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
				</Box>
				<Box
					display="flex"
					gap={2}
					justifyContent="flex-start"
					alignItems="flex-start"
				>
					<Box pt={2}>
						<IoColorFillOutline />
					</Box>
					<FormControl isInvalid={!!errors.color}>
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
								required: "Please pick a color",
								min: "Please pick a color",
							}}
							render={({ field: { onChange, value, ref } }) => (
								<Box
									p={2}
									borderRadius="3px"
									borderColor="text.100"
									borderWidth="1px"
									bg="#FAFAF9"
								>
									<CirclePicker
										color={value}
										onChange={(e) => onChange(e.hex)}
										ref={ref}
										circleSize={22}
										width="100%"
									/>
								</Box>
							)}
						/>
						<FormErrorMessage>
							{errors.color && errors.color.message}
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
				<IconButton
					variant="outline"
					size="sm"
					onClick={cancel}
					aria-label="cancel"
					icon={<RxExit />}
				/>
				<Button
					bg="brand.500"
					size="sm"
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
					Create Tag
				</Button>
			</Box>
		</form>
	);
};

export default TagForm;
