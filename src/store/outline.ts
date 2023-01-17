import create from "zustand";
import { devtools } from "zustand/middleware";

type WordsRecord = Record<string, { wordId: string; isAutoFill: boolean }>;
type SentencesRecord = Record<
	string,
	{ sentence: string; translation: string }
>;
type GrammarPointsRecord = Record<string, { title: string }>;

interface OutlineStore {
	words: WordsRecord;
	sentences: SentencesRecord;
	grammarPoints: GrammarPointsRecord;

	setWords: (words: WordsRecord) => void;
	setSentences: (sentences: SentencesRecord) => void;
	setGrammarPoints: (grammarPoints: GrammarPointsRecord) => void;

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
}

const useOutlineStore = create<OutlineStore>()(
	devtools(
		(set) => ({
			words: {},
			sentences: {},
			grammarPoints: {},

			setWords: (words: WordsRecord) => set(() => ({ words })),
			setSentences: (sentences: SentencesRecord) => set(() => ({ sentences })),
			setGrammarPoints: (grammarPoints: GrammarPointsRecord) =>
				set(() => ({ grammarPoints })),

			appendWord: ({ key, word }) =>
				set((state) => ({
					words: { ...state.words, [key]: word },
				})),
			removeWord: (nodeKey) =>
				set((state) => {
					const newState = { ...state.words };
					delete newState[nodeKey];
					return { words: newState };
				}),

			appendGrammarPoint: ({ key, grammarPoint }) =>
				set((state) => ({
					grammarPoints: { ...state.grammarPoints, [key]: grammarPoint },
				})),
			removeGrammarPoint: (nodeKey) =>
				set((state) => {
					const newState = { ...state.grammarPoints };
					delete newState[nodeKey];
					return { grammarPoints: newState };
				}),

			appendSentence: ({ key, sentence }) =>
				set((state) => ({
					sentences: { ...state.sentences, [key]: sentence },
				})),
			removeSentence: (nodeKey) =>
				set((state) => {
					const newState = { ...state.sentences };
					delete newState[nodeKey];
					return { sentences: newState };
				}),

			clear: () => set(() => ({ words: {}, sentences: {}, grammarPoints: {} })),
		}),
		{
			name: "outline-storage",
		}
	)
);

export default useOutlineStore;
