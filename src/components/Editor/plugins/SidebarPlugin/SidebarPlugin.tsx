import { Box, Button, Divider, IconButton, useToken } from "@chakra-ui/react";
import { $isSentenceNode } from "@components/Editor/nodes/Sentence/SentenceNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent } from "@lexical/utils";
import { $getSelection, $isRangeSelection } from "lexical";
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
			if (
				!selection ||
				!$isRangeSelection(selection) ||
				!selection.isCollapsed()
			)
				return;

			const node = selection.anchor.getNode();
			const parent = $findMatchingParent(node, $isSentenceNode);
			if (!$isSentenceNode(parent)) return;

			parent.setShowTranslation(!parent.getShowTranslation());
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
