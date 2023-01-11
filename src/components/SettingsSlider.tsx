import {
	Box,
	Slider,
	SliderFilledTrack,
	SliderMark,
	SliderThumb,
	SliderTrack,
} from "@chakra-ui/react";

type SettingsSliderProps = {
	value: number;
	onChange: (newValue: number) => void;
};
const SettingsSlider = ({ value, onChange }: SettingsSliderProps) => {
	const maxValue = 100;
	const steps = [...new Array(5)].map((_, i) => i);

	return (
		<Box
			//borderColor="text.100"
			//borderWidth="1px"
			borderRadius="5px"
			py={2}
			px={3}
			display="flex"
			alignItems="center"
			//bg="brand.50"
		>
			<Slider
				defaultValue={0}
				min={0}
				max={80}
				step={20}
				onChange={onChange}
				value={value}
			>
				{steps.map((step) => {
					const markValue = step * (maxValue / steps.length);
					return (
						<SliderMark
							key={step}
							value={markValue}
							borderColor={value >= markValue ? "brand.500" : "text.300"}
							borderWidth="4px"
							borderRadius="100%"
							transform="translate(-50%, -50%)"
						/>
					);
				})}
				<SliderTrack bg="text.300">
					<Box position="relative" right={10} />
					<SliderFilledTrack bg="brand.500" />
				</SliderTrack>
				<SliderThumb boxSize={4} borderColor="text.100" border="1px" />
			</Slider>
		</Box>
	);
};

export default SettingsSlider;
