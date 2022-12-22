import { z } from "zod";

import { router, protectedProcedure } from "../trpc";

export const dictionaryRouter = router({
	createWord: protectedProcedure
		.input(
			z.object({
				word: z.string(),
				translations: z.array(z.string()),
				spelling: z.string().optional(),
				comment: z.string().optional(),
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
				ctx: { prisma, session },
				input: { translations, spelling, word, tags, documentId, comment },
			}) => {
				const dbWord = await prisma.word.create({
					data: {
						user: { connect: { id: session.user.id } },
						translation: translations.join(";"),
						spelling,
						word,
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
										: {
												create: {
													name: tag.name,
													color: tag.color,
													user: { connect: { id: session.user.id } },
												},
										  },
							})),
						},
						comment,
					},
					include: {
						tags: true,
					},
				});
				const wordWithDeserializedTranslations = {
					...dbWord,
					//@TODO WHAT?
					comment: dbWord.comment || undefined,
					spelling: dbWord.spelling || undefined,
					translations: !!dbWord.translation.trim()
						? dbWord.translation.split(";")
						: [],
					documentId: dbWord.documentId || undefined,
					tags: dbWord.tags.map((tagOnWord) => tagOnWord.tagId),
				};
				return wordWithDeserializedTranslations;
			}
		),
	updateWord: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				translations: z.array(z.string()).optional(),
				spelling: z.string().optional(),
				comment: z.string().optional(),
				tags: z
					.array(
						z.union([
							z.string(),
							z.object({
								name: z.string(),
								color: z.string(),
							}),
						])
					)
					.optional(),
			})
		)
		.mutation(
			async ({
				ctx: { prisma, session },
				input: { id, comment, spelling, tags, translations },
			}) => {
				return await prisma.word.update({
					where: { userWordId: { id, userId: session.user.id } },
					data: {
						comment: comment,
						spelling: spelling,
						translation: !!translations ? translations.join(";") : undefined,
					},
				});
			}
		),
	getAllTags: protectedProcedure.query(({ ctx: { prisma, session } }) => {
		return prisma.tag.findMany({
			where: {
				user: {
					id: session.user.id,
				},
			},
		});
	}),
	findTags: protectedProcedure
		.input(String)
		.query(({ ctx: { prisma, session }, input }) => {
			return prisma.tag.findMany({
				where: {
					name: {
						contains: input,
					},
					user: {
						id: session.user.id,
					},
				},
			});
		}),
	createTag: protectedProcedure
		.input(z.object({ name: z.string(), color: z.string() }))
		.mutation(async ({ ctx: { prisma, session }, input: { name, color } }) => {
			const tag = await prisma.tag.create({
				data: {
					user: { connect: { id: session.user.id } },
					name,
					color,
				},
			});
			return tag;
		}),
	getWord: protectedProcedure
		.input(z.string())
		.query(async ({ ctx: { prisma, session }, input }) => {
			const dbResult = await prisma.word.findUnique({
				where: { userWordId: { id: input, userId: session.user.id } },
				include: {
					sourceDocument: {
						select: {
							title: true,
							id: true,
						},
					},
					tags: {
						include: {
							tag: true,
						},
					},
				},
			});
			if (dbResult) {
				const { translation, ...rest } = dbResult;
				return {
					...rest,
					translations: !!translation.trim() ? translation.split(";") : [],
				};
			}
			return null;
		}),
	getAll: protectedProcedure.query(async ({ ctx: { prisma, session } }) => {
		const allWords = await prisma.word.findMany({
			where: {
				user: {
					id: session.user.id,
				},
			},
			include: {
				tags: {
					include: {
						tag: true,
					},
				},
			},
		});
		return allWords.map(({ translation, ...rest }) => ({
			...rest,
			translations: translation.split(";"),
		}));
	}),
});
