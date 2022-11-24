import React, { useState, useRef, useEffect } from "react";
import Button from "./Button";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import useOnClickOutside from "@ui/hooks/useOnClickOutside";
import { createPortal } from "react-dom";

type DropdownMenuProps = { children: React.ReactNode; anchor: HTMLElement };
const DropdownMenu = ({ children, anchor }: DropdownMenuProps) => {
	const rect = anchor.getBoundingClientRect();
	const left = rect.left;
	const top = rect.top + rect.height + window.scrollY;

	return createPortal(
		<div
			className="visible absolute z-30 origin-top scale-100 list-none divide-y
			divide-gray-200 rounded-t border border-gray-200 bg-gray-100
			text-gray-200 opacity-100 shadow-sm transition duration-100 ease-in-out"
			style={{ left, top }}
		>
			<ul
				className="flex min-w-[100px] bg-gray-100 py-1"
				aria-labelledby="dropdown"
			>
				{React.Children.map(children, (child, i) => (
					<li key={i}>{child}</li>
				))}
			</ul>
		</div>,
		document.body
	);
};

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
		<div className="" ref={dropDownRef}>
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
			{visible && dropDownRef.current && (
				<DropdownMenu anchor={dropDownRef.current}>{children}</DropdownMenu>
			)}
		</div>
	);
};

export default Dropdown;
