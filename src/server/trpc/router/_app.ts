import { router } from "../trpc";
import { authRouter } from "./auth";
import { dictionaryRouter } from "./dictionary";
import { documentRouter } from "./document";
import { exampleRouter } from "./example";
import { userRouter } from "./user";

export const appRouter = router({
	example: exampleRouter,
	dictionary: dictionaryRouter,
	document: documentRouter,
	auth: authRouter,
	user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
