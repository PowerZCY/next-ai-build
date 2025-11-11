import { z, ZodObject } from 'zod';
import { frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';

// Reusable schema for date
export const createDateSchema = () =>
  z.preprocess((arg: any) => {
    if (arg instanceof Date) {
      // Format Date object to YYYY-MM-DD string
      const year = arg.getFullYear();
      const month = (arg.getMonth() + 1).toString().padStart(2, '0');
      const day = arg.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (typeof arg === 'string') {
      return arg.trim();
    }
    // For other types or null/undefined, let the subsequent string validation handle it
    return arg; 
  },
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format or a valid Date object")
    .refine((val: any) => !isNaN(new Date(val).getTime()), 'Invalid date!')
  );

// common docs frontmatter  schema
// @ts-ignore
export const createCommonDocsSchema = (): ZodObject<any> => frontmatterSchema
  .extend({
    date: createDateSchema(),
    author: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  });

// common meta schema
// @ts-ignore
export const createCommonMetaSchema = (): ZodObject<any> => metaSchema.extend({
  
});

export const remarkInstallOptions = {
  persist: {
    id: 'package-manager',
  },
};