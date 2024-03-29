import { useToast } from "@chakra-ui/react";
import { $isImageNode, ImageNode } from "@components/Editor/nodes/ImageNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import supaBaseClient from "@utils/supaBaseClient";
import { $getNodeByKey, COMMAND_PRIORITY_LOW, createCommand } from "lexical";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export const SET_UPLOADED_IMAGE_SRC = createCommand<{
	key: string;
	url: string;
	freeObjectUrl: boolean;
}>("SET_IMAGE_SRC");

const SaveImagesPlugin = () => {
	const [editor] = useLexicalComposerContext();
	const { data: session } = useSession();
	const toast = useToast();

	useEffect(() => {
		return mergeRegister(
			editor.registerMutationListener(ImageNode, (nodes) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of nodes) {
						const node = $getNodeByKey(nodeKey);
						if (!$isImageNode(node)) continue;

						const isUplaoded = node.getIsUploaded();
						if (
							!isUplaoded &&
							(mutation === "created" || mutation === "updated")
						) {
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
