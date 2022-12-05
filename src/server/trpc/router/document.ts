import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const documentRouter = router({
	upsertDocument: publicProcedure
		.input(
			z.object({
				title: z.string().optional(),
				serializedDocument: z.string(),
				id: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			let dbDocument;
			if (input.id) {
				dbDocument = await ctx.prisma.document.update({
					where: {
						id: input.id,
					},
					data: {
						title: input.title || "Untitled Document",
						serializedDocument: input.serializedDocument,
					},
				});
			} else {
				dbDocument = await ctx.prisma.document.create({
					data: {
						title: input.title || "Untitled Document",
						serializedDocument: input.serializedDocument,
					},
				});
			}
			return dbDocument;
		}),
	updateDocument: publicProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().optional(),
				serializedDocument: z.string(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const currentDocument = await ctx.prisma.document.findUnique({
				where: { id: input.id },
			});
			if (!currentDocument) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message:
						"Trying to update a document which is not found in the database",
				});
			}
			ctx.prisma.document.update({
				where: { id: currentDocument.id },
				data: {
					serializedDocument: input.serializedDocument,
					title: input.title || currentDocument.title,
				},
			});
		}),
	getById: publicProcedure.input(String).query(({ ctx, input }) => {
		return ctx.prisma.document.findUnique({ where: { id: input } });
	}),
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.document.findMany();
	}),
});
