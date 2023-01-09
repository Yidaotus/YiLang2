import { z } from "zod";

import { router, protectedProcedure } from "../trpc";

export const userRouter = router({
	stats: protectedProcedure.query(async ({ ctx: { prisma, session } }) => {
		const documentCount = await prisma.document.groupBy({
			by: ["languageId"],
			where: {
				user: {
					id: session.user.id,
				},
			},
			_count: {
				id: true,
			},
		});
		const wordCount = await prisma.word.groupBy({
			by: ["languageId"],
			where: {
				user: {
					id: session.user.id,
				},
			},
			_count: {
				id: true,
			},
		});

		const byLanguageMap: Record<string, { words: number; documents: number }> =
			{};
		for (const docCount of documentCount) {
			byLanguageMap[docCount.languageId] = {
				words: 0,
				documents: docCount._count.id,
			};
		}
		for (const words of wordCount) {
			const entry = byLanguageMap[words.languageId];
			if (!entry) {
				byLanguageMap[words.languageId] = {
					words: 0,
					documents: 0,
				};
			} else {
				entry.words = words._count.id;
			}
		}

		return {
			documentCount: documentCount.reduce(
				(acc, current) => (acc += current._count.id),
				0
			),
			wordCount: wordCount.reduce(
				(acc, current) => (acc += current._count.id),
				0
			),
			byLanguageMap,
		};
	}),
});
