import type { LexicalCommand } from "lexical";

import { ImageNode, $isImageNode } from "@components/Editor/nodes/ImageNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import supaBaseClient from "@utils/supaBaseClient";
import { $getNodeByKey, COMMAND_PRIORITY_LOW, createCommand } from "lexical";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { mergeRegister } from "@lexical/utils";
import { useToast } from "@chakra-ui/react";

export const SET_UPLOADED_IMAGE_SRC: LexicalCommand<{
	key: string;
	url: string;
	freeObjectUrl: boolean;
}> = createCommand("SET_IMAGE_SRC");

const SaveImagesPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const { data: session } = useSession();
	const toast = useToast();

	useEffect(() => {
		return mergeRegister(
			editor.registerMutationListener(ImageNode, (nodes) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of nodes) {
						if (mutation === "created") {
							const node = $getNodeByKey(nodeKey);
							if (!$isImageNode(node)) continue;

							if (!node.getIsUploaded()) {
								fetch(node.getSrc()).then(async (imgData) => {
									if (!imgData.ok) {
										return;
									}
									const blob = await imgData.blob();
									const { data, error } = await supaBaseClient.storage
										.from("yilang-images")
										.upload(
											`${session?.user?.id || "public"}/images/${Date.now()}`,
											blob,
											{
												contentType: imgData.headers.get("Content-Type") || "",
											}
										);

									if (error) {
										toast({
											title: "Error uploading image!",
											description: error.message,
											status: "error",
											isClosable: true,
										});
									}

									if (data) {
										const publicUrl = supaBaseClient.storage
											.from("yilang-images")
											.getPublicUrl(data.path);
										editor.dispatchCommand(SET_UPLOADED_IMAGE_SRC, {
											key: nodeKey,
											url: publicUrl.data.publicUrl,
											freeObjectUrl: true,
										});
										toast({
											title: "Image uploaded!",
											description: "Image uploaded successfully and saved.",
											status: "success",
											isClosable: true,
										});
									}
								});
							}
						}
					}
				});
			}),
			editor.registerCommand(
				SET_UPLOADED_IMAGE_SRC,
				({ key, url, freeObjectUrl }) => {
					const targetNode = $getNodeByKey(key);
					if (!$isImageNode(targetNode)) return true;

					const currentUrl = targetNode.getSrc();
					if (freeObjectUrl && currentUrl && currentUrl.startsWith("blob")) {
						window.URL.revokeObjectURL(currentUrl);
					}

					targetNode.setSrc(url);
					targetNode.setIsUploaded(true);
					return true;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	});

	return null;
};

export default SaveImagesPlugin;
