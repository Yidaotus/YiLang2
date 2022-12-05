import type { ForwardRefRenderFunction, KeyboardEventHandler } from "react";
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
};

const YiSimpleCreatableSelect: ForwardRefRenderFunction<
	any,
	YiSimpleCreatableSelectProps
> = ({ value, onChange, placeholder }, ref) => {
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

	return (
		<CreatableSelect
			ref={ref}
			components={components}
			inputValue={inputValue}
			isClearable
			size="sm"
			isMulti
			options={[] as Array<string>}
			menuIsOpen={false}
			getOptionLabel={(option) => option}
			getOptionValue={(option) => option}
			onChange={(newValue) => onChange([...value, newValue.toString()])}
			onInputChange={(newValue) => setInputValue(newValue)}
			onKeyDown={handleKeyDown}
			placeholder={placeholder}
			value={value}
		/>
	);
};

export default React.forwardRef(YiSimpleCreatableSelect);
