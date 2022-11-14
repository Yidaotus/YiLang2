import { router } from "../trpc";
import { authRouter } from "./auth";
import { exampleRouter } from "./example";
import { dictionaryRouter } from "./dictionary";
import { documentRouter } from "./document";

export const appRouter = router({
	example: exampleRouter,
	dictionary: dictionaryRouter,
	document: documentRouter,
	auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
