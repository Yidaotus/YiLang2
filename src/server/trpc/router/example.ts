import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const exampleRouter = router({
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
	hello: publicProcedure
		.input(z.object({ text: z.string().nullish() }).nullish())
		.query(({ input }) => {
			return {
				greeting: `Hello ${input?.text ?? "world"}`,
			};
		}),
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.example.findMany();
	}),
});
