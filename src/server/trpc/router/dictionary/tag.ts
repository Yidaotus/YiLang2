import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const tagRouter = router({
	getAll: protectedProcedure
		.input(z.object({ language: z.string() }))
		.query(({ ctx: { prisma, session }, input: { language } }) => {
			return prisma.tag.findMany({
				where: {
					user: {
						id: session.user.id,
					},
					language: {
						id: language,
					},
				},
			});
		}),
	find: protectedProcedure
		.input(z.object({ searchString: z.string(), language: z.string() }))
		.query(
			({ ctx: { prisma, session }, input: { searchString, language } }) => {
				return prisma.tag.findMany({
					where: {
						name: {
							contains: searchString,
						},
						user: {
							id: session.user.id,
						},
						language: {
							id: language,
						},
					},
				});
			}
		),
	create: protectedProcedure
		.input(
			z.object({ name: z.string(), color: z.string(), language: z.string() })
		)
		.mutation(
			async ({
				ctx: { prisma, session },
				input: { name, color, language },
			}) => {
				const tag = await prisma.tag.create({
					data: {
						user: { connect: { id: session.user.id } },
						language: {
							connect: {
								userLanguageId: {
									userId: session.user.id,
									id: language,
								},
							},
						},
						name,
						color,
					},
				});
				return tag;
			}
		),
});
