import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

const isString = <T>(input: T | string): input is string =>
	typeof input === "string";
const isNotString = <T>(input: T | string): input is T =>
	typeof input !== "string";

export const wordRouter = router({
	create: protectedProcedure
		.input(
			z.object({
				word: z.string(),
				language: z.string(),
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
				input: {
					translations,
					spelling,
					word,
					tags,
					documentId,
					comment,
					language,
				},
			}) => {
				const dbWord = await prisma.word.create({
					data: {
						user: { connect: { id: session.user.id } },
						translation: translations.join(";"),
						spelling,
						word,
						language: {
							connect: {
								userLanguageId: { userId: session.user.id, id: language },
							},
						},
						sourceDocument: documentId
							? {
									connect: { id: documentId },
							  }
							: undefined,
						tags: {
							create: tags.filter(isNotString).map((newTag) => ({
								name: newTag.name,
								color: newTag.color,
								user: { connect: { id: session.user.id } },
								language: {
									connect: {
										userLanguageId: {
											userId: session.user.id,
											id: language,
										},
									},
								},
							})),
							connect: tags.filter(isString).map((tagId) => ({ id: tagId })),
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
				};
				return wordWithDeserializedTranslations;
			}
		),
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				translations: z.array(z.string()).optional(),
				spelling: z.string().optional(),
				comment: z.string().optional(),
				language: z.string(),
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
				input: { id, comment, spelling, tags, translations, language },
			}) => {
				if (tags) {
					await prisma.word.update({
						where: {
							id,
						},
						data: {
							tags: {
								set: [],
							},
						},
					});
				}
				return await prisma.word.update({
					where: { userWordId: { id, userId: session.user.id } },
					data: {
						comment: comment,
						spelling: spelling,
						translation: !!translations ? translations.join(";") : undefined,
						tags: tags
							? {
									create: tags.filter(isNotString).map((newTag) => ({
										name: newTag.name,
										color: newTag.color,
										user: { connect: { id: session.user.id } },
										language: {
											connect: {
												userLanguageId: {
													userId: session.user.id,
													id: language,
												},
											},
										},
									})),
									connect: tags
										.filter(isString)
										.map((tagId) => ({ id: tagId })),
							  }
							: { set: [] },
					},
				});
			}
		),
	getRecent: protectedProcedure
		.input(z.object({ take: z.number() }))
		.query(async ({ ctx: { prisma, session }, input: { take } }) => {
			const recentWords = await prisma.word.findMany({
				where: {
					user: { id: session.user.id },
				},
				include: {
					language: true,
				},
				orderBy: {
					createdAt: "desc",
				},
				take,
			});
			return recentWords.map((word) => ({
				...word,
				translations: word.translation.split(";"),
			}));
		}),
	find: protectedProcedure
		.input(z.object({ word: z.string(), language: z.string() }))
		.query(async ({ ctx: { prisma, session }, input: { word, language } }) => {
			const foundWord = await prisma.word.findFirst({
				where: {
					word: {
						equals: word,
					},
					user: {
						id: session.user.id,
					},
					language: {
						id: language,
					},
				},
				include: {
					sourceDocument: {
						select: {
							title: true,
							id: true,
						},
					},
					tags: true,
				},
			});

			if (foundWord) {
				const { translation, ...rest } = foundWord;
				return {
					...rest,
					translations: !!translation.trim() ? translation.split(";") : [],
				};
			}
			return foundWord;
		}),
	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx: { prisma, session }, input: { id } }) => {
			const dbResult = await prisma.word.findUnique({
				where: { userWordId: { id, userId: session.user.id } },
				include: {
					sourceDocument: {
						select: {
							title: true,
							id: true,
						},
					},
					tags: true,
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
	search: protectedProcedure
		.input(
			z.object({
				search: z.string(),
				languageId: z.string(),
			})
		)
		.query(
			async ({ ctx: { prisma, session }, input: { languageId, search } }) => {
				const foundWords = await prisma.word.findMany({
					where: {
						user: { id: session.user.id },
						language: { id: languageId },
						OR: [
							{ word: { contains: search, mode: "insensitive" } },
							{ translation: { contains: search, mode: "insensitive" } },
						],
					},
					include: { sourceDocument: { select: { title: true } } },
				});
				return foundWords;
			}
		),
	getAll: protectedProcedure
		.input(z.object({ language: z.string() }))
		.query(async ({ ctx: { prisma, session }, input: { language } }) => {
			const allWords = await prisma.word.findMany({
				where: {
					user: {
						id: session.user.id,
					},
					language: {
						id: language,
					},
				},
				include: {
					tags: true,
				},
			});
			return allWords.map(({ translation, ...rest }) => ({
				...rest,
				translations: translation.split(";"),
			}));
		}),
});
