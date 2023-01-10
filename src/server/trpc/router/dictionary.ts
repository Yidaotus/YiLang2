import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const dictionaryRouter = router({
	createLanguage: protectedProcedure
		.input(z.object({ name: z.string() }))
		.mutation(async ({ ctx: { prisma, session }, input: { name } }) => {
			return prisma.language.create({
				data: {
					name,
					user: { connect: { id: session.user.id } },
				},
			});
		}),
	createWord: protectedProcedure
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
							create: tags.map((tag) => ({
								tag:
									typeof tag === "string"
										? { connect: { id: tag } }
										: {
												create: {
													name: tag.name,
													color: tag.color,
													user: { connect: { id: session.user.id } },
													language: {
														connect: {
															userLanguageId: {
																userId: session.user.id,
																id: language,
															},
														},
													},
												},
										  },
							})),
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
					tags: dbWord.tags.map((tagOnWord) => tagOnWord.tagId),
				};
				return wordWithDeserializedTranslations;
			}
		),
	updateWord: protectedProcedure
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
					await prisma.tagsOnWords.deleteMany({
						where: {
							wordId: id,
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
									create: tags.reverse().map((tag) => ({
										tag:
											typeof tag === "string"
												? { connect: { id: tag } }
												: {
														create: {
															name: tag.name,
															color: tag.color,
															user: { connect: { id: session.user.id } },
															language: {
																connect: {
																	userLanguageId: {
																		userId: session.user.id,
																		id: language,
																	},
																},
															},
														},
												  },
									})),
							  }
							: undefined,
					},
				});
			}
		),
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
	getRecentDocuments: protectedProcedure
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
	getRecentWords: protectedProcedure
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
	getAllLanguages: protectedProcedure.query(({ ctx: { prisma, session } }) => {
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
	addLanguage: protectedProcedure
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
	removeLanguage: protectedProcedure
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
	getAllTags: protectedProcedure
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
	changeLanguageName: protectedProcedure
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
	findWord: protectedProcedure
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
					tags: {
						include: {
							tag: true,
						},
					},
				},
			});

			if (foundWord) {
				const { translation, ...rest } = foundWord;
				return {
					...rest,
					tags: foundWord.tags.map((tOnW) => tOnW.tag),
					translations: !!translation.trim() ? translation.split(";") : [],
				};
			}
			return foundWord;
		}),
	findTags: protectedProcedure
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
	createTag: protectedProcedure
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
	getWord: protectedProcedure
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
					tags: {
						include: {
							tag: true,
						},
					},
				},
			});
			if (dbResult) {
				const { translation, ...rest } = dbResult;
				return {
					...rest,
					tags: dbResult.tags.map((tOnW) => tOnW.tag),
					translations: !!translation.trim() ? translation.split(";") : [],
				};
			}
			return null;
		}),
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
					tags: {
						include: {
							tag: true,
						},
					},
				},
			});
			return allWords.map(({ translation, ...rest }) => ({
				...rest,
				translations: translation.split(";"),
			}));
		}),
});
