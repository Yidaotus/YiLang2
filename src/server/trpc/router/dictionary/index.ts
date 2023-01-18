import { router } from "../../trpc";
import { grammarPointRouter } from "./grammarPoint";
import { languageRouter } from "./language";
import { sentenceRouter } from "./sentence";
import { tagRouter } from "./tag";
import { wordRouter } from "./word";

export const dictionaryRouter = router({
	grammarPoint: grammarPointRouter,
	word: wordRouter,
	sentence: sentenceRouter,
	language: languageRouter,
	tag: tagRouter,
});
