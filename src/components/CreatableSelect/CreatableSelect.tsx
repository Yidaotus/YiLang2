import {
	ForwardRefRenderFunction,
	KeyboardEventHandler,
	useCallback,
} from "react";
import type { RefCallBack } from "react-hook-form";

import { useState } from "react";
import { CreatableSelect } from "chakra-react-select";
import React from "react";

const components = {
	DropdownIndicator: null,
};

type YiSimpleCreatableSelectProps = {
	value: Array<string>;
	onChange: (newValue: Array<string>) => void;
	placeholder: string;
	ref: RefCallBack;
	autoFocus?: boolean;
};

const YiSimpleCreatableSelect: ForwardRefRenderFunction<
	any,
	YiSimpleCreatableSelectProps
> = ({ value, onChange, placeholder, autoFocus }, ref) => {
	const [inputValue, setInputValue] = useState("");

	const handleKeyDown: KeyboardEventHandler = (event) => {
		if (!inputValue) return;
		switch (event.key) {
			case "Enter":
			case "Tab":
				onChange([...value, inputValue]);
				setInputValue("");
				event.preventDefault();
		}
	};

	const onBlurHandler = useCallback(() => {
		if (inputValue.trim()) {
			onChange([...value, inputValue.trim()]);
		}
	}, [inputValue, onChange, value]);

	return (
		<CreatableSelect
			chakraStyles={{
				container: (prev) => ({
					...prev,
					borderRadius: "5px",
					bg: "#fafaf9",
				}),
				placeholder: (prev) => ({
					...prev,
					color: "text.200",
				}),
			}}
			ref={ref}
			components={components}
			autoFocus={autoFocus}
			inputValue={inputValue}
			isClearable
			size="md"
			isMulti
			options={[] as Array<string>}
			menuIsOpen={false}
			getOptionLabel={(option) => option}
			getOptionValue={(option) => option}
			onChange={(newValue) => onChange(newValue.map((v) => v))}
			onInputChange={(newValue) => setInputValue(newValue)}
			onBlur={onBlurHandler}
			onKeyDown={handleKeyDown}
			placeholder={placeholder}
			value={value}
		/>
	);
};

export default React.forwardRef(YiSimpleCreatableSelect);
