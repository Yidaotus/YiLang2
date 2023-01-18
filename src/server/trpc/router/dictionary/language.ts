import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const languageRouter = router({
	create: protectedProcedure
		.input(z.object({ name: z.string() }))
		.mutation(async ({ ctx: { prisma, session }, input: { name } }) => {
			return prisma.language.create({
				data: {
					name,
					user: { connect: { id: session.user.id } },
				},
			});
		}),
	getAllLookupSources: protectedProcedure
		.input(z.object({ languageId: z.string() }))
		.query(({ ctx: { prisma, session }, input: { languageId } }) => {
			return prisma.lookupSource.findMany({
				where: {
					language: {
						id: languageId,
					},
					user: {
						id: session.user.id,
					},
				},
			});
		}),
	getAll: protectedProcedure.query(({ ctx: { prisma, session } }) => {
		return prisma.language.findMany({
			where: {
				user: {
					id: session.user.id,
				},
			},
			include: {
				lookupSources: true,
			},
		});
	}),
	add: protectedProcedure
		.input(z.object({ name: z.string() }))
		.mutation(async ({ ctx: { prisma, session }, input: { name } }) => {
			const language = await prisma.language.create({
				data: {
					user: { connect: { id: session.user.id } },
					name,
				},
			});
			return language;
		}),
	remove: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx: { prisma, session }, input: { id } }) => {
			await prisma.language.delete({
				where: {
					userLanguageId: {
						id,
						userId: session.user.id,
					},
				},
			});
		}),
	changeName: protectedProcedure
		.input(z.object({ id: z.string(), name: z.string() }))
		.mutation(async ({ ctx: { prisma, session }, input: { id, name } }) => {
			await prisma.language.update({
				where: {
					userLanguageId: {
						userId: session.user.id,
						id,
					},
				},
				data: {
					name,
				},
			});
		}),
	removeLookupSource: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async ({ ctx: { prisma, session }, input: { id } }) => {
			await prisma.lookupSource.delete({
				where: {
					userLookupSourceId: {
						id,
						userId: session.user.id,
					},
				},
			});
		}),
	changeLookupSource: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string(),
				url: z.string(),
			})
		)
		.mutation(
			async ({ ctx: { prisma, session }, input: { id, name, url } }) => {
				await prisma.lookupSource.update({
					where: {
						userLookupSourceId: {
							id,
							userId: session.user.id,
						},
					},
					data: {
						name,
						url,
					},
				});
			}
		),
	addLookupSource: protectedProcedure
		.input(
			z.object({
				languageId: z.string(),
				sourceName: z.string(),
				sourceUrl: z.string(),
			})
		)
		.mutation(
			async ({
				ctx: { prisma, session },
				input: { languageId, sourceName, sourceUrl },
			}) => {
				await prisma.lookupSource.create({
					data: {
						name: sourceName,
						url: sourceUrl,
						language: {
							connect: {
								userLanguageId: {
									userId: session.user.id,
									id: languageId,
								},
							},
						},
						user: {
							connect: { id: session.user.id },
						},
					},
				});
			}
		),
});
