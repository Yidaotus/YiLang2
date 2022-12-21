import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, protectedProcedure } from "../trpc";

export const documentRouter = router({
	upsertDocument: protectedProcedure
		.input(
			z.object({
				title: z.string().optional(),
				serializedDocument: z.string(),
				id: z.string().optional(),
			})
		)
		.mutation(async ({ ctx: { prisma, session }, input }) => {
			let dbDocument;
			if (input.id) {
				dbDocument = await prisma.document.update({
					where: {
						id: input.id,
					},
					data: {
						title: input.title || "Untitled Document",
						serializedDocument: input.serializedDocument,
					},
				});
			} else {
				dbDocument = await prisma.document.create({
					data: {
						title: input.title || "Untitled Document",
						serializedDocument: input.serializedDocument,
						user: { connect: { id: session.user.id } },
					},
				});
			}
			return dbDocument;
		}),
	updateDocument: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().optional(),
				serializedDocument: z.string(),
			})
		)
		.mutation(async ({ ctx: { prisma, session }, input }) => {
			const currentDocument = await prisma.document.findUnique({
				where: {
					id: input.id,
				},
			});
			if (!currentDocument) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message:
						"Trying to update a document which is not found in the database",
				});
			}
			prisma.document.update({
				where: { id: currentDocument.id },
				data: {
					serializedDocument: input.serializedDocument,
					title: input.title || currentDocument.title,
					user: { connect: { id: session.user.id } },
				},
			});
		}),
	getById: protectedProcedure
		.input(String)
		.query(({ ctx: { prisma, session }, input }) => {
			return prisma.document.findUnique({
				where: {
					id: input,
				},
			});
		}),
	getAll: protectedProcedure.query(({ ctx: { prisma, session } }) => {
		return prisma.document.findMany({
			where: { user: { id: session.user.id } },
		});
	}),
});
