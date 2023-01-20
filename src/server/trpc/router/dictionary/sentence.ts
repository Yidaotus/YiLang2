import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const sentenceRouter = router({
	getForWord: protectedProcedure
		.input(z.object({ wordId: z.string() }))
		.query(({ ctx: { prisma, session }, input: { wordId } }) => {
			return prisma.sentence.findMany({
				where: {
					user: {
						id: session.user.id,
					},
					words: {
						some: {
							id: wordId,
						},
					},
				},
			});
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
				const foundSentences = await prisma.sentence.findMany({
					where: {
						user: { id: session.user.id },
						language: { id: languageId },
						OR: [
							{ sentence: { contains: search, mode: "insensitive" } },
							{ translation: { contains: search, mode: "insensitive" } },
						],
					},
					include: { sourceDocument: { select: { title: true, id: true } } },
				});
				console.debug({ foundSentences, languageId, search });
				return foundSentences;
			}
		),
	deleteMany: protectedProcedure
		.input(
			z.object({
				ids: z.array(z.string()),
				nodeKeys: z.array(z.string()).optional(),
			})
		)
		.mutation(
			async ({ ctx: { prisma, session }, input: { ids, nodeKeys } }) => {
				await prisma.sentence.deleteMany({
					where: {
						user: { id: session.user.id },
						id: { in: ids },
					},
				});
				return { ids, nodeKeys };
			}
		),
	upsert: protectedProcedure
		.input(
			z.object({
				id: z.string().optional().nullable(),
				sentence: z.string(),
				translation: z.string(),
				containingWords: z.array(z.string()),
				sourceDocumentId: z.string(),
				languageId: z.string(),
				nodeKey: z.string().optional(),
			})
		)
		.mutation(
			async ({
				ctx: { prisma, session },
				input: {
					id,
					sentence,
					translation,
					containingWords,
					sourceDocumentId,
					languageId,
					nodeKey,
				},
			}) => {
				const newSentence = await prisma.sentence.upsert({
					where: {
						id: id || "",
					},
					create: {
						sentence,
						translation,
						user: { connect: { id: session.user.id } },
						words: {
							connect: containingWords.map((wordId) => ({
								id: wordId,
							})),
						},
						sourceDocument: {
							connect: {
								id: sourceDocumentId,
							},
						},
						language: {
							connect: {
								userLanguageId: { id: languageId, userId: session.user.id },
							},
						},
					},
					update: {
						sentence,
						translation,
						words: {
							set: containingWords.map((wordId) => ({
								id: wordId,
							})),
						},
					},
				});
				return { ...newSentence, nodeKey };
			}
		),
});
