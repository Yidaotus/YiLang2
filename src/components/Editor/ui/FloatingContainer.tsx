import type { Middleware, Placement, ReferenceType } from "@floating-ui/react";
import { Box } from "@chakra-ui/react";
import { arrow, flip, offset, shift, useFloating } from "@floating-ui/react";
import { useEffect, useRef } from "react";

const shiftOnHeader: Middleware = {
	name: "shiftByOnePixel",
	fn({ elements }) {
		const elemY = elements.reference.getBoundingClientRect().y;
		if (elemY < 150) {
			return {
				reset: {
					placement: "bottom",
				},
			};
		}
		return {};
	},
};

type FloatingContainerProps = {
	popupReference: ReferenceType | null;
	children: React.ReactNode;
	popupPlacement: Placement;
};
const FloatingContainer = ({
	popupReference,
	children,
	popupPlacement,
}: FloatingContainerProps) => {
	const arrowRef = useRef(null);
	const { x, y, reference, floating, strategy, placement } = useFloating({
		placement: popupPlacement,
		middleware: [
			offset(10),
			shift(),
			arrow({ element: arrowRef }),
			flip(),
			shiftOnHeader,
		],
	});

	useEffect(() => {
		reference(popupReference);
	}, [reference, popupReference]);

	const visible = popupReference !== null;

	return (
		<Box
			ref={floating}
			userSelect={visible ? "inherit" : "none"}
			pointerEvents={visible ? "inherit" : "none"}
			width={["100vw", null, "max-content"]}
			px={[2, null, 0]}
			style={{
				position: strategy,
				top: y ?? 0,
				left: x ?? 0,
				width: "max-content",
			}}
		>
			<Box
				opacity={visible ? 1 : 0}
				transform={visible ? "scale(1)" : "scale(0.9)"}
				sx={{
					transition:
						"100ms transform ease-out, 100ms opacity ease-out, 0ms left linear",
					zIndex: 30,
					borderRadius: "5px",
					bg: "white",
					border: "1px solid #e2e8f0",
					boxShadow: "0px 0px 8px 4px rgba(0, 0, 0, 0.05)",
				}}
			>
				<Box ref={arrowRef}>
					<Box
						pos="absolute"
						zIndex={10}
						w="10px"
						h="10px"
						left="50%"
						bottom={placement === "top" ? "-2px" : undefined}
						top={placement === "bottom" ? "-10px" : undefined}
						transform={`scale(1.4, 0.8) translate(-50%, 50%)
						 ${placement === "top" ? "rotate(-135deg)" : "rotate(45deg)"}`}
						borderTop="1px solid #e2e8f0"
						borderLeft="1px solid #e2e8f0"
						bg="#FFFFFF"
					/>
				</Box>
				{children}
			</Box>
		</Box>
	);
};

export default FloatingContainer;
