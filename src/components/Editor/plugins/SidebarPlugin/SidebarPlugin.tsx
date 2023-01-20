import { Box, Button, Divider, IconButton, useToken } from "@chakra-ui/react";
import {
	$createDialogueContainerNode,
	$createDialogueSpeakerNode,
	$createDialogueSpeechNode,
} from "@components/Editor/nodes/Dialogue";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createTextNode,
	$getSelection,
	$insertNodes,
	$isParagraphNode,
	$isRangeSelection,
} from "lexical";
import { useCallback } from "react";
import { createPortal } from "react-dom";
import { IoSaveOutline } from "react-icons/io5";
import { SAVE_EDITOR } from "../SaveToDBPlugin/SaveToDBPlugin";
import FormatterMenu from "./FormatterMenu";
import LayoutMenu from "./LayoutMenu";
import SentenceList from "./SentenceList";
import SettingsMenu from "./SettingsMenu";
import WordList from "./WordList";

type SidebarPluginProps = {
	sidebarPortal: HTMLElement;
};
const SidebarPlugin = ({ sidebarPortal }: SidebarPluginProps) => {
	const [text400] = useToken("colors", ["text.400"]);
	const [editor] = useLexicalComposerContext();

	const saveDocument = useCallback(async () => {
		editor.dispatchCommand(SAVE_EDITOR, { shouldShowToast: true });
	}, [editor]);

	const DEBUG = useCallback(() => {
		editor.update(() => {
			const selection = $getSelection();
			if (!selection || !$isRangeSelection(selection)) return;

			const container = $createDialogueContainerNode();
			for (const node of selection.getNodes()) {
				if ($isParagraphNode(node)) {
					const text = node.getTextContent();
					const splits = text.split(":");
					if (splits.length > 1) {
						const [speaker, ...speech] = splits;
						const speakerNode = $createDialogueSpeakerNode().append(
							$createTextNode(speaker?.trim())
						);
						const speechNode = $createDialogueSpeechNode().append(
							$createTextNode(speech.join("").trim())
						);

						container.append(speakerNode, speechNode);
					}
				}
			}

			if (container.getChildrenSize() < 1) {
				const speaker = $createDialogueSpeakerNode().append(
					$createTextNode(" ")
				);
				const speech = $createDialogueSpeechNode().append($createTextNode(" "));
				container.append(speaker, speech);
			}

			$insertNodes([container]);
		});
	}, [editor]);

	return createPortal(
		<Box
			w="100%"
			pos="relative"
			display="grid"
			gridTemplateColumns="1fr 1fr"
			gap="4px"
			pt="1rem"
		>
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<FormatterMenu />
			<SettingsMenu />
			<IconButton
				icon={
					<IoSaveOutline
						color={text400}
						style={{
							height: "24px",
							width: "24px",
						}}
					/>
				}
				variant="ghost"
				color="text.500"
				aria-label="Bold"
				onClick={saveDocument}
			/>
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<WordList />
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<SentenceList />
			<Divider
				borderWidth="2px"
				borderRadius="3px"
				mb="0.5rem"
				gridColumn="span 2"
			/>
			<LayoutMenu />
			<Button onClick={DEBUG}>Debug</Button>
		</Box>,
		sidebarPortal
	);
};

export default SidebarPlugin;
