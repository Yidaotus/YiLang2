import create from "zustand";
import { devtools } from "zustand/middleware";

type StoreObject = {
	isDirty: boolean;
	isDeleted: boolean;
};

type WordsRecord = Record<string, { databaseId: string; isAutoFill: boolean }>;
type SentencesRecord = Record<
	string,
	{
		sentence: string;
		translation: string;
		containingWords: Array<string>;
		databaseId: string | null;
	}
>;
type GrammarPointsRecord = Record<
	string,
	{ title: string; databaseId: string | null }
>;

type StoreWordsRecord = Record<
	keyof WordsRecord,
	WordsRecord[keyof WordsRecord] & StoreObject
>;
type StoreSentencesRecord = Record<
	keyof SentencesRecord,
	SentencesRecord[keyof SentencesRecord] & StoreObject
>;
type StoreGrammarPointsRecord = Record<
	keyof GrammarPointsRecord,
	GrammarPointsRecord[keyof GrammarPointsRecord] & StoreObject
>;

interface OutlineStore {
	words: StoreWordsRecord;
	sentences: StoreSentencesRecord;
	grammarPoints: StoreGrammarPointsRecord;

	serverState: {
		words: StoreWordsRecord;
		sentences: StoreSentencesRecord;
		grammarPoints: StoreGrammarPointsRecord;
	};

	actions: {
		setWords: (words: StoreWordsRecord) => void;
		setSentences: (sentences: StoreSentencesRecord) => void;
		setGrammarPoints: (grammarPoints: StoreGrammarPointsRecord) => void;
		appendGrammarPoint: ({
			key,
			grammarPoint,
		}: {
			key: keyof GrammarPointsRecord;
			grammarPoint: GrammarPointsRecord[keyof GrammarPointsRecord];
		}) => void;
		removeGrammarPoint: (nodeKey: string) => void;

		appendWord: ({
			key,
			word,
		}: {
			key: keyof WordsRecord;
			word: WordsRecord[keyof WordsRecord];
		}) => void;
		removeWord: (nodeKey: string) => void;

		appendSentence: ({
			key,
			sentence,
		}: {
			key: keyof SentencesRecord;
			sentence: SentencesRecord[keyof SentencesRecord];
		}) => void;
		removeSentence: (nodeKey: string) => void;

		clear: () => void;
		markServerState: () => void;
	};
}

const useOutlineStore = create<OutlineStore>()(
	devtools(
		(set) => ({
			words: {},
			sentences: {},
			grammarPoints: {},

			serverState: {
				words: {},
				sentences: {},
				grammarPoints: {},
			},

			actions: {
				setWords: (words: StoreWordsRecord) => set(() => ({ words })),
				setSentences: (sentences: StoreSentencesRecord) =>
					set(() => ({ sentences })),
				setGrammarPoints: (grammarPoints: StoreGrammarPointsRecord) =>
					set(() => ({ grammarPoints })),

				appendWord: ({ key, word }) =>
					set((state) => ({
						words: {
							...state.words,
							[key]: {
								...word,
								isDirty: true,
								isDeleted: false,
							},
						},
					})),
				removeWord: (nodeKey) =>
					set((state) => {
						const stateWord = state.words[nodeKey];
						if (stateWord) {
							return {
								words: {
									...state.words,
									[nodeKey]: {
										...stateWord,
										isDirty: true,
										isDeleted: true,
									},
								},
							};
						}
						return {};
					}),

				appendGrammarPoint: ({ key, grammarPoint }) =>
					set((state) => ({
						grammarPoints: {
							...state.grammarPoints,
							[key]: {
								...grammarPoint,
								isDirty: true,
								isDeleted: false,
							},
						},
					})),
				removeGrammarPoint: (nodeKey) =>
					set((state) => {
						const stateGrammarPoint = state.grammarPoints[nodeKey];
						if (stateGrammarPoint) {
							return {
								grammarPoints: {
									...state.grammarPoints,
									[nodeKey]: {
										...stateGrammarPoint,
										isDirty: true,
										isDeleted: true,
									},
								},
							};
						}
						return {};
					}),

				appendSentence: ({ key, sentence }) =>
					set((state) => ({
						sentences: {
							...state.sentences,
							[key]: {
								...sentence,
								isDirty: true,
								isDeleted: false,
							},
						},
					})),
				removeSentence: (nodeKey) =>
					set((state) => {
						const stateSentence = state.sentences[nodeKey];
						if (stateSentence) {
							return {
								sentences: {
									...state.sentences,
									[nodeKey]: {
										...stateSentence,
										isDirty: true,
										isDeleted: true,
									},
								},
							};
						}
						return {};
					}),

				clear: () =>
					set(() => ({ words: {}, sentences: {}, grammarPoints: {} })),
				markServerState: () =>
					set((state) => {
						const newServerState = {
							grammarPoints: { ...state.grammarPoints },
							words: { ...state.words },
							sentences: { ...state.sentences },
						};

						const cleanSentences = { ...state.sentences };
						Object.entries(cleanSentences).forEach(([nodeKey, sentence]) => {
							if (sentence.isDeleted) {
								delete cleanSentences[nodeKey];
							} else {
								sentence.isDeleted = false;
								sentence.isDirty = false;
							}
						});

						const cleanWords = { ...state.words };
						Object.entries(cleanWords).forEach(([nodeKey, word]) => {
							if (word.isDeleted) {
								delete cleanWords[nodeKey];
							} else {
								word.isDeleted = false;
								word.isDirty = false;
							}
						});

						const cleanGrammarPoints = { ...state.grammarPoints };
						Object.entries(cleanGrammarPoints).forEach(
							([nodeKey, grammarPoint]) => {
								if (grammarPoint.isDeleted) {
									delete cleanGrammarPoints[nodeKey];
								} else {
									grammarPoint.isDeleted = false;
									grammarPoint.isDirty = false;
								}
							}
						);
						return {
							serverState: newServerState,
							sentences: cleanSentences,
							words: cleanWords,
							grammarPoints: cleanGrammarPoints,
						};
					}),
			},
		}),
		{
			name: "outline-storage",
		}
	)
);

export const useOutlineActions = () =>
	useOutlineStore((state) => state.actions);
export const useOutlineWords = () => useOutlineStore((state) => state.words);
export const useOutlineSentences = () =>
	useOutlineStore((state) => state.sentences);
export const useOutlineGrammarPoints = () =>
	useOutlineStore((state) => state.grammarPoints);
export const useOutlineServerState = () =>
	useOutlineStore((state) => state.serverState);
