import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const dictionaryRouter = router({
	createWord: publicProcedure
		.input(z.object({ word: z.string(), translation: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const word = await ctx.prisma.word.create({
				data: {
					translation: input.translation,
					word: input.word,
				},
			});

			console.debug(word);
		}),
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.word.findMany();
	}),
});
