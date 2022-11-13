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
			return word;
		}),
	getWord: publicProcedure.input(z.string()).query(({ ctx, input }) => {
		return ctx.prisma.word.findUnique({ where: { id: input } });
	}),
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.word.findMany();
	}),
});
