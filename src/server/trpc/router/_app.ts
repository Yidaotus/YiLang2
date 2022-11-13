import { router } from "../trpc";
import { authRouter } from "./auth";
import { exampleRouter } from "./example";
import { dictionaryRouter } from "./dictionary";

export const appRouter = router({
	example: exampleRouter,
	dictionary: dictionaryRouter,
	auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
