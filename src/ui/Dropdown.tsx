import React, { useState, useRef, useEffect } from "react";
import Button from "./Button";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";

type DropdownProps = { children: React.ReactNode };
const Dropdown = ({ children }: DropdownProps) => {
	const [show, setShow] = useState(false);
	const [visible, setVisible] = useState(false);
	const dropDownRef = useRef(null);

	useOnClickOutside(dropDownRef, () => setShow(false));

	useEffect(() => {
		let tov: ReturnType<typeof setTimeout>;
		if (!show) {
			tov = setTimeout(() => {
				setVisible(false);
			}, 100);
		} else {
			setVisible(true);
		}
		return () => {
			if (tov) {
				clearTimeout(tov);
			}
		};
	}, [show]);

	return (
		<div className="relative" ref={dropDownRef}>
			<Button
				ghost
				onClick={() => setShow(!show)}
				className={show ? "bg-gray-200" : ""}
			>
				<div className="flex items-center">
					<div>Drooo</div>
					{show ? (
						<ChevronUpIcon className="ml-2 block w-3 text-gray-800" />
					) : (
						<ChevronDownIcon className="ml-2 block w-3 text-gray-800" />
					)}
				</div>
			</Button>
			<div
				className={`${
					show
						? "visible scale-100 opacity-100"
						: "pointer-events-none invisible scale-95 opacity-0"
				} ${!visible && "invisible"} text-contrast absolute z-50 my-2 origin-top
				 list-none divide-y divide-gray-200
				rounded border border-gray-200 bg-gray-50 shadow-sm
				transition duration-100 ease-in-out`}
			>
				<ul className="min-w-[100px] py-1" aria-labelledby="dropdown">
					{React.Children.map(children, (child) => (
						<li>{child}</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default Dropdown;
