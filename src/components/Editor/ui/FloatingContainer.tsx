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
	middlewares?: Array<Middleware>;
};
const FloatingContainer = ({
	popupReference,
	children,
	popupPlacement,
	middlewares,
}: FloatingContainerProps) => {
	const arrowRef = useRef(null);
	const {
		x,
		y,
		reference,
		floating,
		strategy,
		placement,
		middlewareData,
		refs,
	} = useFloating({
		placement: popupPlacement,
		middleware: [
			offset(10),
			shift(),
			flip(),
			shiftOnHeader,
			...(middlewares || []),
			arrow({ element: arrowRef, padding: 0 }),
		],
	});

	useEffect(() => {
		reference(popupReference);
	}, [reference, popupReference]);

	const visible = popupReference !== null;

	let arrowRotation = 0;
	let arrowY = middlewareData?.arrow?.y || 0;
	let arrowX = middlewareData?.arrow?.x || 0;
	const height = refs.floating.current?.clientHeight || 0;
	const width = refs.floating.current?.clientWidth || 0;

	if (placement === "left") {
		arrowRotation = 135;
		arrowX += width - 5;
	}
	if (placement === "right") {
		arrowRotation = -90;
		arrowX -= 5;
	}
	if (placement === "bottom") {
		arrowRotation = 45;
		arrowY -= 5;
	}
	if (placement === "top") {
		arrowRotation = -135;
		arrowY += height - 5;
	}

	return (
		<Box
			ref={floating}
			userSelect={visible ? "inherit" : "none"}
			pointerEvents={visible ? "inherit" : "none"}
			opacity={visible ? 1 : 0}
			transform={visible ? "scale(1)" : "scale(0.9)"}
			width={["100vw", null, "max-content"]}
			px={[2, null, 0]}
			transition="100ms transform ease-out, 100ms opacity ease-out, 0ms left linear"
			zIndex={30}
			borderRadius="5px"
			bg="white"
			border="1px solid #e2e8f0"
			boxShadow="0px 0px 8px 4px rgba(0, 0, 0, 0.05)"
			style={{
				position: strategy,
				top: y ?? 0,
				left: x ?? 0,
				width: "max-content",
			}}
		>
			<Box>{children}</Box>
			<Box
				ref={arrowRef}
				pos="absolute"
				zIndex={10}
				top={`${arrowY}px`}
				left={`${arrowX}px`}
				w="10px"
				h="10px"
				transform={`rotate(${arrowRotation}deg)`}
				borderTop="1px solid #e2e8f0"
				borderLeft="1px solid #e2e8f0"
				bg="#FFFFFF"
			/>
		</Box>
	);
};

export default FloatingContainer;
