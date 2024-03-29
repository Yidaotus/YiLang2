import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const documentRouter = router({
	upsertDocument: protectedProcedure
		.input(
			z.object({
				title: z.string().optional(),
				serializedDocument: z.string().optional(),
				id: z.string().optional(),
				language: z.string(),
			})
		)
		.mutation(
			async ({
				ctx: { prisma, session },
				input: { title, serializedDocument, id, language },
			}) => {
				let dbDocument;
				if (id) {
					dbDocument = await prisma.document.update({
						where: {
							userDocumentId: { id, userId: session.user.id },
						},
						data: {
							title: title || "Untitled Document",
							serializedDocument,
						},
					});
				} else {
					dbDocument = await prisma.document.create({
						data: {
							title: title || "Untitled Document",
							user: { connect: { id: session.user.id } },
							language: {
								connect: {
									userLanguageId: { userId: session.user.id, id: language },
								},
							},
						},
					});
				}
				return dbDocument;
			}
		),
	updateDocument: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().optional(),
				serializedDocument: z.string(),
			})
		)
		.mutation(async ({ ctx: { prisma, session }, input }) => {
			return prisma.document.update({
				where: {
					userDocumentId: { userId: session.user.id, id: input.id },
				},
				data: {
					serializedDocument: input.serializedDocument,
					title: input.title,
				},
			});
		}),
	removeDocument: protectedProcedure
		.input(String)
		.mutation(({ ctx: { prisma, session }, input }) => {
			return prisma.document.delete({
				where: {
					userDocumentId: {
						id: input,
						userId: session.user.id,
					},
				},
			});
		}),
	getById: protectedProcedure
		.input(String)
		.query(({ ctx: { prisma, session }, input }) => {
			return prisma.document.findUnique({
				where: {
					userDocumentId: { id: input, userId: session.user.id },
				},
			});
		}),
	getAll: protectedProcedure
		.input(z.object({ language: z.string() }))
		.query(({ ctx: { prisma, session }, input: { language } }) => {
			return prisma.document.findMany({
				where: { user: { id: session.user.id }, language: { id: language } },
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
				const foundDocuments = await prisma.document.findMany({
					where: {
						user: { id: session.user.id },
						language: { id: languageId },
						title: { contains: search, mode: "insensitive" },
					},
				});
				return foundDocuments;
			}
		),
	getRecent: protectedProcedure
		.input(z.object({ take: z.number() }))
		.query(({ ctx: { prisma, session }, input: { take } }) => {
			return prisma.document.findMany({
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
		}),
});
