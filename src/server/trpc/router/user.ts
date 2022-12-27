import { z } from "zod";

import { router, protectedProcedure } from "../trpc";

export const userRouter = router({
	stats: protectedProcedure.query(async ({ ctx: { prisma, session } }) => {
		const documentCount = await prisma.document.count({
			where: {
				user: {
					id: session.user.id,
				},
			},
		});
		const wordCount = await prisma.word.count({
			where: {
				user: {
					id: session.user.id,
				},
			},
		});

		return { documentCount, wordCount };
	}),
});
