import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const grammarPointRouter = router({
	search: protectedProcedure
		.input(
			z.object({
				search: z.string(),
				languageId: z.string(),
			})
		)
		.query(
			async ({ ctx: { prisma, session }, input: { languageId, search } }) => {
				const foundGrammarPoints = await prisma.grammarPoint.findMany({
					where: {
						user: { id: session.user.id },
						sourceDocument: { languageId },
						title: { contains: search, mode: "insensitive" },
					},
					include: { sourceDocument: { select: { title: true, id: true } } },
				});
				return foundGrammarPoints;
			}
		),
	getAll: protectedProcedure
		.input(
			z.object({
				languageId: z.string(),
			})
		)
		.query(async ({ ctx: { prisma, session }, input: { languageId } }) => {
			const allGrammarPoints = prisma.grammarPoint.findMany({
				where: {
					user: { id: session.user.id },
					sourceDocument: { languageId },
				},
				include: { sourceDocument: { select: { title: true } } },
			});
			return allGrammarPoints;
		}),
	deleteMany: protectedProcedure
		.input(
			z.object({
				ids: z.array(z.string()),
				nodeKeys: z.array(z.string()).optional(),
			})
		)
		.mutation(
			async ({ ctx: { prisma, session }, input: { ids, nodeKeys } }) => {
				await prisma.grammarPoint.deleteMany({
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
				title: z.string(),
				sourceDocumentId: z.string(),
				nodeKey: z.string().optional(),
			})
		)
		.mutation(
			async ({
				ctx: { prisma, session },
				input: { id, title, sourceDocumentId, nodeKey },
			}) => {
				const grammarPoint = await prisma.grammarPoint.upsert({
					where: {
						id: id || "",
					},
					create: {
						title,
						user: { connect: { id: session.user.id } },
						sourceDocument: {
							connect: {
								id: sourceDocumentId,
							},
						},
					},
					update: {
						title,
					},
				});
				return { ...grammarPoint, nodeKey };
			}
		),
});
