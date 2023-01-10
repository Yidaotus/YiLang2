import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import type { ElementFormatType, LexicalCommand } from "lexical";
import {
	$getNearestRootOrShadowRoot,
	$getSelection,
	$insertNodes,
	$isNodeSelection,
	COMMAND_PRIORITY_LOW,
	COMMAND_PRIORITY_NORMAL,
	createCommand,
	FORMAT_ELEMENT_COMMAND,
} from "lexical";
import { useEffect } from "react";
import type { ImageAlignment, ImagePayload } from "../../nodes/ImageNode";

import {
	$createImageNode,
	$isImageNode,
	ImageNode,
} from "@editor/nodes/ImageNode";

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
	createCommand("INSERT_IMAGE_COMMAND");

/*
export function InsertImageUriDialogBody({
	onClick,
}: {
	onClick: (payload: InsertImagePayload) => void;
}) {
	const [src, setSrc] = useState("");
	const [altText, setAltText] = useState("");

	const isDisabled = src === "";

	return (
		<>
			<input
				type="text"
				// label="Image URL"
				placeholder="i.e. https://source.unsplash.com/random"
				onChange={(e) => setSrc(e.target.value)}
				value={src}
				data-test-id="image-modal-url-input"
			/>
			<input
				label="Alt Text"
				placeholder="Random unsplash image"
				onChange={setAltText}
				value={altText}
				data-test-id="image-modal-alt-text-input"
			/>
			<DialogActions>
				<Button
					data-test-id="image-modal-confirm-btn"
					disabled={isDisabled}
					onClick={() => onClick({ altText, src })}
				>
					Confirm
				</Button>
			</DialogActions>
		</>
	);
}

export function InsertImageUploadedDialogBody({
	onClick,
}: {
	onClick: (payload: InsertImagePayload) => void;
}) {
	const [src, setSrc] = useState("");
	const [altText, setAltText] = useState("");

	const isDisabled = src === "";

	const loadImage = (files: FileList | null) => {
		const reader = new FileReader();
		reader.onload = function () {
			if (typeof reader.result === "string") {
				setSrc(reader.result);
			}
			return "";
		};
		if (files !== null) {
			reader.readAsDataURL(files[0]);
		}
	};

	return (
		<>
			<FileInput
				label="Image Upload"
				onChange={loadImage}
				accept="image/*"
				data-test-id="image-modal-file-upload"
			/>
			<TextInput
				label="Alt Text"
				placeholder="Descriptive alternative text"
				onChange={setAltText}
				value={altText}
				data-test-id="image-modal-alt-text-input"
			/>
			<DialogActions>
				<Button
					data-test-id="image-modal-file-upload-btn"
					disabled={isDisabled}
					onClick={() => onClick({ altText, src })}
				>
					Confirm
				</Button>
			</DialogActions>
		</>
	);
}

export function InsertImageDialog({
	activeEditor,
	onClose,
}: {
	activeEditor: LexicalEditor;
	onClose: () => void;
}): JSX.Element {
	const [mode, setMode] = useState<null | "url" | "file">(null);
	const hasModifier = useRef(false);

	useEffect(() => {
		hasModifier.current = false;
		const handler = (e: KeyboardEvent) => {
			hasModifier.current = e.altKey;
		};
		document.addEventListener("keydown", handler);
		return () => {
			document.removeEventListener("keydown", handler);
		};
	}, [activeEditor]);

	const onClick = (payload: InsertImagePayload) => {
		activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
		onClose();
	};

	return (
		<>
			{!mode && (
				<DialogButtonsList>
					<Button
						data-test-id="image-modal-option-sample"
						onClick={() =>
							onClick(
								hasModifier.current
									? {
											altText:
												"Daylight fir trees forest glacier green high ice landscape",
											src: landscapeImage,
									  }
									: {
											altText: "Yellow flower in tilt shift lens",
											src: yellowFlowerImage,
									  }
							)
						}
					>
						Sample
					</Button>
					<Button
						data-test-id="image-modal-option-url"
						onClick={() => setMode("url")}
					>
						URL
					</Button>
					<Button
						data-test-id="image-modal-option-file"
						onClick={() => setMode("file")}
					>
						File
					</Button>
				</DialogButtonsList>
			)}
			{mode === "url" && <InsertImageUriDialogBody onClick={onClick} />}
			{mode === "file" && <InsertImageUploadedDialogBody onClick={onClick} />}
		</>
	);
}
*/

export default function ImagesPlugin({
	captionsEnabled,
}: {
	captionsEnabled?: boolean;
}): JSX.Element | null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (!editor.hasNodes([ImageNode])) {
			throw new Error("ImagesPlugin: ImageNode not registered on editor");
		}

		return mergeRegister(
			editor.registerNodeTransform(ImageNode, (node) => {
				const parent = node.getParent();
				if (!parent) return;
				if (parent != $getNearestRootOrShadowRoot(node)) {
					parent.insertAfter(node);
				}
			}),
			editor.registerCommand<ElementFormatType>(
				FORMAT_ELEMENT_COMMAND,
				(formatType) => {
					const selection = $getSelection();
					if (!$isNodeSelection(selection)) return false;

					const nodes = selection.getNodes();
					if (nodes.length < 1) return false;

					const node = nodes[0];
					if (!$isImageNode(node)) return false;

					let cleanFormat: ImageAlignment;
					if (!formatType) {
						cleanFormat = "left";
					} else if (formatType === "justify") {
						cleanFormat = "center";
					} else if (formatType === "start") {
						cleanFormat = "left";
					} else if (formatType === "end") {
						cleanFormat = "right";
					} else {
						cleanFormat = formatType;
					}

					node.setAlignment(cleanFormat);
					return true;
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand<InsertImagePayload>(
				INSERT_IMAGE_COMMAND,
				(payload) => {
					const imageNode = $createImageNode(payload);
					$insertNodes([imageNode]);
					/*
					if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
						$wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
					}
					*/

					return true;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [captionsEnabled, editor]);

	return null;
}

declare global {
	interface DragEvent {
		rangeOffset?: number;
		rangeParent?: Node;
	}
}
