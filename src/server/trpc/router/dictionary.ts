import { z } from "zod";

import { router, publicProcedure } from "../trpc";

function isNotString<T>(i: string | T): i is T {
	return typeof i !== "string";
}
function isString<T>(i: string | T): i is string {
	return typeof i === "string";
}

export const dictionaryRouter = router({
	createWord: publicProcedure
		.input(
			z.object({
				word: z.string(),
				translation: z.string(),
				spelling: z.string().optional(),
				tags: z.array(
					z.union([
						z.string(),
						z.object({
							name: z.string(),
							color: z.string(),
						}),
					])
				),
				documentId: z.string().optional(),
			})
		)
		.mutation(
			async ({
				ctx,
				input: { translation, spelling, word, tags, documentId },
			}) => {
				const dbWord = await ctx.prisma.word.create({
					data: {
						translation: translation,
						spelling: spelling,
						word: word,
						sourceDocument: documentId
							? {
									connect: { id: documentId },
							  }
							: undefined,
						tags: {
							create: tags.map((tag) => ({
								tag:
									typeof tag === "string"
										? { connect: { id: tag } }
										: { create: { name: tag.name, color: tag.color } },
							})),
						},
					},
					include: {
						tags: true,
					},
				});
				return dbWord;
			}
		),
	getAllTags: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.tag.findMany();
	}),
	findTags: publicProcedure.input(String).query(({ ctx, input }) => {
		return ctx.prisma.tag.findMany({
			where: {
				name: {
					contains: input,
				},
			},
		});
	}),
	createTag: publicProcedure
		.input(z.object({ name: z.string(), color: z.string() }))
		.mutation(async ({ ctx, input: { name, color } }) => {
			const tag = await ctx.prisma.tag.create({
				data: {
					name,
					color,
				},
			});
			return tag;
		}),
	getWord: publicProcedure.input(z.string()).query(({ ctx, input }) => {
		return ctx.prisma.word.findUnique({
			where: { id: input },
			include: {
				tags: {
					include: {
						tag: true,
					},
				},
			},
		});
	}),
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.word.findMany();
	}),
});
