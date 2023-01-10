import type { LexicalCommand } from "lexical";

import { $getSelection, COMMAND_PRIORITY_NORMAL, PASTE_COMMAND } from "lexical";
import { $createImageNode } from "@components/Editor/nodes/ImageNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createCommand } from "lexical";
import { useEffect } from "react";

export const SET_UPLOADED_IMAGE_SRC: LexicalCommand<{
	key: string;
	url: string;
	freeObjectUrl: boolean;
}> = createCommand("SET_IMAGE_SRC");

const PasteImageFromClipboardPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			PASTE_COMMAND,
			(e: ClipboardEvent) => {
				const { clipboardData } = e;
				if (clipboardData) {
					for (const item of clipboardData.items) {
						const file = item.getAsFile();
						if (!file || !file.type.includes("image")) continue;
						const src = window.URL.createObjectURL(file);
						const clipBoardImageNode = $createImageNode({
							altText: "clipboard image",
							src,
							height: 400,
						});
						$getSelection()?.insertNodes([clipBoardImageNode]);
					}
				}
				return false;
			},
			COMMAND_PRIORITY_NORMAL
		);
	});

	return null;
};

export default PasteImageFromClipboardPlugin;
