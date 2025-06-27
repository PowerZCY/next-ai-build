import { z } from 'zod';
import { frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';


// Reusable schema for title
export const createTitleSchema = () =>
  z.string({
    required_error: "Title is required",
    invalid_type_error: "Title must be a string and cannot be null",
  })
  .trim()
  .min(1, { message: "Title cannot be empty or consist only of whitespace" });

// Reusable schema for description
export const createDescriptionSchema = () =>
  z.preprocess(
    (val: any) => {
      if (typeof val === 'string') {
        return val.trim() === "" || val === null ? undefined : val.trim();
      }
      return val === null ? undefined : val;
    },
    z.string().optional()
  );

// Reusable schema for icon
export const createIconSchema = () =>
  z.preprocess(
    (val: any) => (val === "" || val === null ? undefined : val),
    z.string().optional()
  );

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
export const createCommonDocsSchema = () => frontmatterSchema.extend({
  title: createTitleSchema(),
  description: createDescriptionSchema(),
  icon: createIconSchema(),
  date: createDateSchema(),
  author: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

// common meta schema
export const createCommonMetaSchema = () => metaSchema.extend({
  description: z.string().optional(),
});

export const remarkInstallOptions = {
  persist: {
    id: 'package-manager',
  },
};