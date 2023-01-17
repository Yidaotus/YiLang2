import type { LexicalNode } from "lexical";

abstract class SaveableNode {
	abstract databaseId: string | null;
	abstract hasChangesForDatabase: boolean;
	abstract shouldDeleteFromDatabaseOnRemove: boolean;

	abstract saveToDatabase(): Promise<string>;
	abstract removeFromDatabse(): Promise<void>;
}

const isSaveable = (
	input: LexicalNode
): input is LexicalNode & SaveableNode => {
	return (input as unknown as SaveableNode).saveToDatabase !== undefined;
};

export default SaveableNode;
export { isSaveable };
