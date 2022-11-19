/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
	GridSelection,
	LexicalEditor,
	NodeKey,
	NodeSelection,
	RangeSelection,
} from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import * as React from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { $isImageNode } from "./ImageNode";
import ImageResizer from "./ImageResizer";

const imageCache = new Set();

function useSuspenseImage(src: string) {
	if (!imageCache.has(src)) {
		throw new Promise((resolve) => {
			const img = new Image();
			img.src = src;
			img.onload = () => {
				imageCache.add(src);
				resolve(null);
			};
		});
	}
}

function LazyImage({
	altText,
	className,
	imageRef,
	src,
	width,
	height,
	maxWidth,
}: {
	altText: string;
	className: string | null;
	height: "inherit" | number;
	imageRef: { current: null | HTMLImageElement };
	maxWidth: number;
	src: string;
	width: "inherit" | number;
}): JSX.Element {
	useSuspenseImage(src);
	return (
		<img
			className={`${className} m-0 p-0`}
			src={src}
			alt={altText}
			ref={imageRef}
			style={{
				height,
				maxWidth,
				width,
			}}
			draggable="false"
		/>
	);
}

export default function ImageComponent({
	src,
	altText,
	nodeKey,
	width,
	height,
	maxWidth,
	resizable,
}: {
	altText: string;
	height: "inherit" | number;
	maxWidth: number;
	nodeKey: NodeKey;
	resizable: boolean;
	src: string;
	width: "inherit" | number;
}): JSX.Element {
	const imageRef = useRef<null | HTMLImageElement>(null);
	const [isSelected, setSelected, clearSelection] =
		useLexicalNodeSelection(nodeKey);
	const [isResizing, setIsResizing] = useState<boolean>(false);
	const [editor] = useLexicalComposerContext();
	const [selection, setSelection] = useState<
		RangeSelection | NodeSelection | GridSelection | null
	>(null);
	const activeEditorRef = useRef<LexicalEditor | null>(null);

	const onDelete = useCallback(
		(payload: KeyboardEvent) => {
			if (isSelected && $isNodeSelection($getSelection())) {
				const event: KeyboardEvent = payload;
				event.preventDefault();
				const node = $getNodeByKey(nodeKey);
				if ($isImageNode(node)) {
					node.remove();
				}
				setSelected(false);
			}
			return false;
		},
		[isSelected, nodeKey, setSelected]
	);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				setSelection(editorState.read(() => $getSelection()));
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_, activeEditor) => {
					activeEditorRef.current = activeEditor;
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand<MouseEvent>(
				CLICK_COMMAND,
				(payload) => {
					const event = payload;

					if (isResizing) {
						return true;
					}
					if (event.target === imageRef.current) {
						if (event.shiftKey) {
							setSelected(!isSelected);
						} else {
							clearSelection();
							setSelected(true);
						}
						return true;
					}

					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				KEY_DELETE_COMMAND,
				onDelete,
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				onDelete,
				COMMAND_PRIORITY_LOW
			)
		);
	}, [
		clearSelection,
		editor,
		isResizing,
		isSelected,
		nodeKey,
		onDelete,
		setSelected,
	]);

	const onResizeEnd = (
		nextWidth: "inherit" | number,
		nextHeight: "inherit" | number
	) => {
		// Delay hiding the resize bars for click case
		setTimeout(() => {
			setIsResizing(false);
		}, 200);

		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if ($isImageNode(node)) {
				node.setWidthAndHeight(nextWidth, nextHeight);
			}
		});
	};

	const onResizeStart = () => {
		setIsResizing(true);
	};

	const draggable = isSelected && $isNodeSelection(selection);
	const isFocused = isSelected || isResizing;
	return (
		<Suspense fallback={null}>
			<div className="flex w-full justify-center py-4">
				<div className="relative inline-block">
					<LazyImage
						className={
							isFocused
								? `focused ${
										$isNodeSelection(selection)
											? "z-10 block outline outline-2 outline-primary-base"
											: ""
								  }`
								: null
						}
						src={src}
						altText={altText}
						imageRef={imageRef}
						width={width}
						height={height}
						maxWidth={maxWidth}
					/>
					{resizable && $isNodeSelection(selection) && isFocused && (
						<ImageResizer
							editor={editor}
							imageRef={imageRef}
							maxWidth={maxWidth}
							onResizeStart={onResizeStart}
							onResizeEnd={onResizeEnd}
						/>
					)}
				</div>
			</div>
		</Suspense>
	);
}
