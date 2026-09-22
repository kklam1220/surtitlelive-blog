import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: ['**/*.{md,mdx}', '!**/_*.{md,mdx}'] }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			tags: z.array(z.string()).optional(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			heroImageAlt: z.string().optional(),
		}),
});

const updates = defineCollection({
	loader: glob({ base: './src/content/updates', pattern: '**/*.json' }),
	schema: z.object({
		locale: z.string(),
		title: z.string(),
		description: z.string(),
		labels: z.object({
			articles: z.string(),
			productUpdates: z.string(),
			weekOf: z.string(),
			released: z.string(),
			product: z.string(),
			new: z.string(),
			improved: z.string(),
			fixed: z.string(),
			noPublicRelease: z.string(),
		}),
		weeks: z.array(z.object({
			startDate: z.coerce.date(),
			endDate: z.coerce.date(),
			versions: z.array(z.object({
				version: z.string(),
				releaseDate: z.coerce.date(),
				product: z.string(),
				summary: z.string(),
				new: z.array(z.string()),
				improved: z.array(z.string()),
				fixed: z.array(z.string()),
			})),
		})),
	}),
});

export const collections = { blog, updates };
