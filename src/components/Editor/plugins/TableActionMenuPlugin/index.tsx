/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
	IconButton,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
} from "@chakra-ui/react";
import FloatingContainer from "@components/Editor/ui/FloatingContainer";
import type { ReferenceType } from "@floating-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useLexicalEditable from "@lexical/react/useLexicalEditable";
import type { HTMLTableElementWithWithTableSelectionState } from "@lexical/table";
import {
	$deleteTableColumn,
	$getElementGridForTableNode,
	$getTableCellNodeFromLexicalNode,
	$getTableColumnIndexFromTableCellNode,
	$getTableNodeFromLexicalNodeOrThrow,
	$getTableRowIndexFromTableCellNode,
	$insertTableColumn,
	$insertTableRow,
	$isTableCellNode,
	$isTableRowNode,
	$removeTableRowAtIndex,
	getTableSelectionFromTableElement,
	TableCellHeaderStates,
	TableCellNode,
} from "@lexical/table";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	DEPRECATED_$isGridSelection,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import { IoChevronDownSharp } from "react-icons/io5";

type TableCellActionMenuProps = Readonly<{
	tableCellNode: TableCellNode;
}>;

function TableActionMenu({
	tableCellNode: _tableCellNode,
}: TableCellActionMenuProps) {
	const [editor] = useLexicalComposerContext();
	const [tableCellNode, updateTableCellNode] = useState(_tableCellNode);
	const [selectionCounts, updateSelectionCounts] = useState({
		columns: 1,
		rows: 1,
	});

	useEffect(() => {
		return editor.registerMutationListener(TableCellNode, (nodeMutations) => {
			const nodeUpdated =
				nodeMutations.get(tableCellNode.getKey()) === "updated";

			if (nodeUpdated) {
				editor.getEditorState().read(() => {
					updateTableCellNode(tableCellNode.getLatest());
				});
			}
		});
	}, [editor, tableCellNode]);

	useEffect(() => {
		editor.getEditorState().read(() => {
			const selection = $getSelection();

			if (DEPRECATED_$isGridSelection(selection)) {
				const selectionShape = selection.getShape();

				updateSelectionCounts({
					columns: selectionShape.toX - selectionShape.fromX + 1,
					rows: selectionShape.toY - selectionShape.fromY + 1,
				});
			}
		});
	}, [editor]);

	const clearTableSelection = useCallback(() => {
		editor.update(() => {
			if (tableCellNode.isAttached()) {
				const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
				const tableElement = editor.getElementByKey(
					tableNode.getKey()
				) as HTMLTableElementWithWithTableSelectionState;

				if (!tableElement) {
					throw new Error("Expected to find tableElement in DOM");
				}

				const tableSelection = getTableSelectionFromTableElement(tableElement);
				if (tableSelection !== null) {
					tableSelection.clearHighlight();
				}

				tableNode.markDirty();
				updateTableCellNode(tableCellNode.getLatest());
			}

			const rootNode = $getRoot();
			rootNode.selectStart();
		});
	}, [editor, tableCellNode]);

	const insertTableRowAtSelection = useCallback(
		(shouldInsertAfter: boolean) => {
			editor.update(() => {
				const selection = $getSelection();

				const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

				let tableRowIndex;

				if (DEPRECATED_$isGridSelection(selection)) {
					const selectionShape = selection.getShape();
					tableRowIndex = shouldInsertAfter
						? selectionShape.toY
						: selectionShape.fromY;
				} else {
					tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
				}

				const grid = $getElementGridForTableNode(editor, tableNode);

				$insertTableRow(
					tableNode,
					tableRowIndex,
					shouldInsertAfter,
					selectionCounts.rows,
					grid
				);

				clearTableSelection();
			});
		},
		[editor, tableCellNode, selectionCounts.rows, clearTableSelection]
	);

	const insertTableColumnAtSelection = useCallback(
		(shouldInsertAfter: boolean) => {
			editor.update(() => {
				const selection = $getSelection();

				const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

				let tableColumnIndex;

				if (DEPRECATED_$isGridSelection(selection)) {
					const selectionShape = selection.getShape();
					tableColumnIndex = shouldInsertAfter
						? selectionShape.toX
						: selectionShape.fromX;
				} else {
					tableColumnIndex =
						$getTableColumnIndexFromTableCellNode(tableCellNode);
				}

				const grid = $getElementGridForTableNode(editor, tableNode);

				$insertTableColumn(
					tableNode,
					tableColumnIndex,
					shouldInsertAfter,
					selectionCounts.columns,
					grid
				);

				clearTableSelection();
			});
		},
		[editor, tableCellNode, selectionCounts.columns, clearTableSelection]
	);

	const deleteTableRowAtSelection = useCallback(() => {
		editor.update(() => {
			const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
			const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

			$removeTableRowAtIndex(tableNode, tableRowIndex);

			clearTableSelection();
		});
	}, [editor, tableCellNode, clearTableSelection]);

	const deleteTableAtSelection = useCallback(() => {
		editor.update(() => {
			const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
			tableNode.remove();

			clearTableSelection();
		});
	}, [editor, tableCellNode, clearTableSelection]);

	const deleteTableColumnAtSelection = useCallback(() => {
		editor.update(() => {
			const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

			const tableColumnIndex =
				$getTableColumnIndexFromTableCellNode(tableCellNode);

			$deleteTableColumn(tableNode, tableColumnIndex);

			clearTableSelection();
		});
	}, [editor, tableCellNode, clearTableSelection]);

	const toggleTableRowIsHeader = useCallback(() => {
		editor.update(() => {
			const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

			const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

			const tableRows = tableNode.getChildren();

			if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
				throw new Error("Expected table cell to be inside of table row.");
			}

			const tableRow = tableRows[tableRowIndex];

			if (!$isTableRowNode(tableRow)) {
				throw new Error("Expected table row");
			}

			tableRow.getChildren().forEach((tableCell) => {
				if (!$isTableCellNode(tableCell)) {
					throw new Error("Expected table cell");
				}

				tableCell.toggleHeaderStyle(TableCellHeaderStates.ROW);
			});

			clearTableSelection();
		});
	}, [editor, tableCellNode, clearTableSelection]);

	const toggleTableColumnIsHeader = useCallback(() => {
		editor.update(() => {
			const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

			const tableColumnIndex =
				$getTableColumnIndexFromTableCellNode(tableCellNode);

			const tableRows = tableNode.getChildren();

			for (let r = 0; r < tableRows.length; r++) {
				const tableRow = tableRows[r];

				if (!$isTableRowNode(tableRow)) {
					throw new Error("Expected table row");
				}

				const tableCells = tableRow.getChildren();

				if (tableColumnIndex >= tableCells.length || tableColumnIndex < 0) {
					throw new Error("Expected table cell to be inside of table row.");
				}

				const tableCell = tableCells[tableColumnIndex];

				if (!$isTableCellNode(tableCell)) {
					throw new Error("Expected table cell");
				}

				tableCell.toggleHeaderStyle(TableCellHeaderStates.COLUMN);
			}

			clearTableSelection();
		});
	}, [editor, tableCellNode, clearTableSelection]);

	return (
		<Menu>
			<MenuButton
				as={IconButton}
				icon={<IoChevronDownSharp />}
				variant="ghost"
				size="sm"
			>
				Actions
			</MenuButton>
			<MenuList>
				<MenuItem onClick={() => insertTableRowAtSelection(true)}>
					Insert{" "}
					{selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`}{" "}
					below
				</MenuItem>
				<MenuItem onClick={() => insertTableColumnAtSelection(false)}>
					Insert{" "}
					{selectionCounts.columns === 1
						? "column"
						: `${selectionCounts.columns} columns`}{" "}
					left
				</MenuItem>
				<MenuItem onClick={() => insertTableColumnAtSelection(true)}>
					Insert{" "}
					{selectionCounts.columns === 1
						? "column"
						: `${selectionCounts.columns} columns`}{" "}
					right
				</MenuItem>
				<MenuItem onClick={() => deleteTableColumnAtSelection()}>
					Delete column
				</MenuItem>
				<MenuItem onClick={() => deleteTableRowAtSelection()}>
					Delete row
				</MenuItem>
				<MenuItem onClick={() => deleteTableAtSelection()}>
					Delete table
				</MenuItem>
				<MenuItem onClick={() => toggleTableRowIsHeader()}>
					{(tableCellNode.__headerState & TableCellHeaderStates.ROW) ===
					TableCellHeaderStates.ROW
						? "Remove"
						: "Add"}{" "}
					row header
				</MenuItem>
				<MenuItem onClick={() => toggleTableColumnIsHeader()}>
					{(tableCellNode.__headerState & TableCellHeaderStates.COLUMN) ===
					TableCellHeaderStates.COLUMN
						? "Remove"
						: "Add"}{" "}
					column header
				</MenuItem>
			</MenuList>
		</Menu>
	);
}

function TableCellActionMenuContainer({
	floatingAnchorElem,
}: {
	floatingAnchorElem: HTMLElement;
}): JSX.Element {
	const [editor] = useLexicalComposerContext();

	const [popupReference, setPopupReference] = useState<ReferenceType | null>(
		null
	);

	const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(
		null
	);

	const moveMenu = useCallback(() => {
		const selection = $getSelection();
		const nativeSelection = window.getSelection();
		const activeElement = document.activeElement;

		if (selection == null) {
			setTableMenuCellNode(null);
			return;
		}

		const rootElement = editor.getRootElement();

		if (
			$isRangeSelection(selection) &&
			rootElement !== null &&
			nativeSelection !== null &&
			rootElement.contains(nativeSelection.anchorNode)
		) {
			const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
				selection.anchor.getNode()
			);

			if (tableCellNodeFromSelection == null) {
				setTableMenuCellNode(null);
				return;
			}

			const tableCellParentNodeDOM = editor.getElementByKey(
				tableCellNodeFromSelection.getKey()
			);

			if (tableCellParentNodeDOM == null) {
				setTableMenuCellNode(null);
				return;
			}

			setTableMenuCellNode(tableCellNodeFromSelection);
		} else if (!activeElement) {
			setTableMenuCellNode(null);
		}
	}, [editor]);

	useEffect(() => {
		return editor.registerUpdateListener(() => {
			editor.getEditorState().read(() => {
				moveMenu();
			});
		});
	});

	useEffect(() => {
		if (tableCellNode != null) {
			const tableCellNodeDOM = editor.getElementByKey(tableCellNode.getKey());
			setPopupReference(tableCellNodeDOM);
		}
	}, [tableCellNode, editor, floatingAnchorElem]);

	return (
		<FloatingContainer
			popupReference={popupReference}
			popupPlacement="right"
			popupOffset={-40}
			showBackground={false}
		>
			{tableCellNode != null && (
				<TableActionMenu tableCellNode={tableCellNode} />
			)}
		</FloatingContainer>
	);
}

export default function TableActionMenuPlugin({
	floatingAnchorElem = document.body,
}: {
	floatingAnchorElem: HTMLElement;
}) {
	const isEditable = useLexicalEditable();
	return isEditable ? (
		<TableCellActionMenuContainer floatingAnchorElem={floatingAnchorElem} />
	) : null;
}
