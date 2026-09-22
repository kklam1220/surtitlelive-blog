import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
    type: 'content',
    // Type-check frontmatter using a schema
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        // Transform string to Date object
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: image().optional(),
        heroImageAlt: z.string().optional(),
        tags: z.array(z.string()).optional(),
    }),
});

const updates = defineCollection({
    type: 'data',
    schema: z.object({
        locale: z.string(),
        title: z.string(),
        description: z.string(),
        intro: z.string(),
        labels: z.object({
            articles: z.string(),
            productUpdates: z.string(),
            weekOf: z.string(),
            released: z.string(),
            availability: z.string(),
            production: z.string(),
            product: z.string(),
            new: z.string(),
            improved: z.string(),
            fixed: z.string(),
            noPublicRelease: z.string(),
            noActionRequired: z.string(),
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
