import type { Middleware, Placement, ReferenceType } from "@floating-ui/react";
import type { ChakraProps } from "@chakra-ui/react";
import { Box, chakra } from "@chakra-ui/react";
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
	stretchOnMobile?: boolean;
	popupOffset?: number;
	showArrow?: boolean;
} & ChakraProps;

const FloatingContainer = ({
	popupReference,
	children,
	popupPlacement,
	middlewares,
	stretchOnMobile = false,
	popupOffset = 10,
	showArrow = false,
	...rest
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
			offset(popupOffset),
			shift(),
			flip(),
			shiftOnHeader,
			...(middlewares || []),
			showArrow && arrow({ element: arrowRef, padding: 0 }),
		],
	});

	useEffect(() => {
		reference(popupReference);
	}, [reference, popupReference]);

	const visible = popupReference !== null;

	const arrowSize = 10;
	let arrowRotation = 0;
	let arrowY = middlewareData?.arrow?.y || 0;
	let arrowX = middlewareData?.arrow?.x || 0;
	const height = refs.floating.current?.clientHeight || 0;
	const width = refs.floating.current?.clientWidth || 0;

	if (placement === "left") {
		arrowRotation = 135;
		arrowX += width - (arrowSize / 2 - 1);
	}
	if (placement === "right") {
		arrowRotation = -90;
		arrowX -= arrowSize / 2 - 1;
	}
	if (placement === "bottom") {
		arrowRotation = 45;
		arrowY -= arrowSize / 2;
	}
	if (placement === "top") {
		arrowRotation = -135;
		arrowY += height - arrowSize / 2;
	}

	return (
		<Box
			ref={floating}
			userSelect={visible ? "inherit" : "none"}
			pointerEvents={visible ? "inherit" : "none"}
			opacity={visible ? 1 : 0}
			transform={visible ? "scale(1)" : "scale(0.9)"}
			transition="100ms transform ease-out, 100ms opacity ease-out, 0ms left linear"
			width={stretchOnMobile ? ["100vw", null, "max-content"] : "max-content"}
			style={{
				position: strategy,
				top: y ?? 0,
				left: x ?? 0,
			}}
		>
			<Box
				zIndex={30}
				borderRadius="5px"
				bg="white"
				border="1px solid #e2e8f0"
				boxShadow="0px 0px 8px 4px rgba(0, 0, 0, 0.05)"
				{...rest}
			>
				<Box>{children}</Box>
				{showArrow && (
					<Box
						ref={arrowRef}
						pos="absolute"
						zIndex={10}
						top={`${arrowY}px`}
						left={`${arrowX}px`}
						w={`${arrowSize}px`}
						h={`${arrowSize}px`}
						transform={`rotate(${arrowRotation}deg)`}
						borderTop="1px solid #e2e8f0"
						borderLeft="1px solid #e2e8f0"
						bg="#FFFFFF"
					/>
				)}
			</Box>
		</Box>
	);
};

export default chakra(FloatingContainer);
