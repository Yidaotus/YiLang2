import { mergeClasses } from "./Base";

type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement>;
const ButtonGroup = ({ children, className, ...other }: ButtonGroupProps) => {
	return (
		<div
			className={mergeClasses(
				className,
				`flex 
				p-0
		  [&>*]:rounded-none
		  [&>*]:border-y
		  [&>*]:border-gray-300
		  [&>*:first-child]:rounded-tl-md
		  [&>*:first-child]:rounded-bl-md
		  [&>*:first-child:not(:last-child)]:border-l
		  [&>*:not(:first-child):last-child]:rounded-l-none
		  [&>*:not(:first-child):last-child]:rounded-br-md
		  [&>*:not(:first-child):last-child]:rounded-tr-md
		  [&>*:not(:first-child):last-child]:border-x
		  [&>*:not(:first-child):not(:last-child)]:border-l
		 `
			)}
			{...other}
		>
			{children}
		</div>
	);
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	ghost?: boolean;
	full?: boolean;
};
const Button = ({
	children,
	className,
	full = false,
	ghost = false,
	...other
}: ButtonProps) => (
	<button
		className={mergeClasses(
			className,
			`rounded-md py-2 px-3 text-base font-semibold transition duration-75 ease-in 
			 ${ghost && "bg-white text-gray-800 hover:bg-gray-100 active:bg-base-200"}
			 ${
					!ghost &&
					"bg-primary-400 hover:bg-primary-400 active:bg-primary-600 text-base-500"
				}
			 ${full && "w-full text-left"}`
		)}
		{...other}
	>
		{children}
	</button>
);

export default Button;
export { ButtonGroup };
