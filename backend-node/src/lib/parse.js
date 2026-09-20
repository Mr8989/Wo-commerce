import { z } from 'zod';
import { ApiError } from './http.js';

// The admin dashboard posts products as multipart/form-data, where every value
// arrives as a string ("true", "12.50", "[\"S\",\"M\"]"). These coercers accept
// both that and a normal JSON body, the way DRF's fields did.

const blank = (value) => value === undefined || value === null || value === '';

const DECIMAL = /^-?\d+(\.\d+)?$/;

export const str = ({ max, allowBlank = false } = {}) => {
  let schema = z.string({ invalid_type_error: 'Not a valid string.' });
  if (max) schema = schema.max(max, `Ensure this field has no more than ${max} characters.`);
  if (!allowBlank) schema = schema.min(1, 'This field may not be blank.');
  return z.preprocess((value) => (value === undefined || value === null ? value : String(value)), schema);
};

export const decimalString = () =>
  z.preprocess(
    (value) => (blank(value) ? value : String(value).trim()),
    z
      .string()
      .refine((value) => DECIMAL.test(value), 'A valid number is required.')
      // Skipped when the value isn't a number at all, so a single bad input
      // doesn't produce two unrelated messages.
      .refine(
        (value) => !DECIMAL.test(value) || Math.abs(Number(value)) < 1e8,
        'Ensure that there are no more than 8 digits before the decimal point.',
      ),
  );

export const integer = ({ min } = {}) =>
  z.preprocess((value) => {
    if (blank(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, min === undefined ? z.number().int('A valid integer is required.') : z.number().int('A valid integer is required.').min(min, `Ensure this value is greater than or equal to ${min}.`));

export const boolean = () =>
  z.preprocess((value) => {
    if (typeof value === 'boolean') return value;
    if (blank(value)) return value;
    const text = String(value).toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(text)) return true;
    if (['false', '0', 'no', 'off', 'null'].includes(text)) return false;
    return value;
  }, z.boolean({ invalid_type_error: 'Must be a valid boolean.' }));

/** A JSON array that may arrive as an already-parsed array or as a JSON string. */
export const jsonArray = () =>
  z.preprocess((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }, z.array(z.any(), { invalid_type_error: 'Value must be valid JSON.' }));

export const url = ({ max = 200 } = {}) =>
  z.preprocess(
    (value) => (value === undefined || value === null ? value : String(value)),
    z.string().max(max, `Ensure this field has no more than ${max} characters.`).url('Enter a valid URL.'),
  );

/**
 * Validate `data` against a zod object schema, returning the parsed value.
 * Throws a 400 shaped like DRF's `{"field": ["message"]}` error body.
 *
 * `partial` drops every key that wasn't supplied, which is how PATCH behaves.
 */
export function validate(schema, data, { partial = false } = {}) {
  const effective = partial ? schema.partial() : schema;
  const present = partial
    ? Object.fromEntries(Object.entries(data ?? {}).filter(([, value]) => value !== undefined))
    : (data ?? {});

  const result = effective.safeParse(present);
  if (result.success) return result.data;

  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length ? issue.path.join('.') : 'non_field_errors';
    const message = issue.code === 'invalid_type' && issue.received === 'undefined' ? 'This field is required.' : issue.message;
    (errors[key] ??= []).push(message);
  }
  throw new ApiError(400, errors);
}

export { z };
