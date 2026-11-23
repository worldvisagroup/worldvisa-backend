export type ZohoFieldValue = string | number | boolean | string[] | null;

export type FieldMap = Readonly<Record<string, string | null>>;

export type Picked<T extends FieldMap> = { [K in keyof T]: ZohoFieldValue };

// Values stay as Zoho returns them; only an empty field (nothing, blank text, no selection) becomes null.
const toValue = (value: unknown): ZohoFieldValue => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? (value as string[]) : null;
  }
  return value as ZohoFieldValue;
};

export const pickFields = <T extends FieldMap>(record: Record<string, unknown>, fields: T): Picked<T> =>
  Object.fromEntries(Object.entries(fields).map(([name, apiName]) => [name, apiName === null ? null : toValue(record[apiName])])) as Picked<T>;

// A Zoho lookup arrives as `{ id, name }`; the migration only needs the id of the record it points to.
export const lookupId = (value: unknown): string | null => {
  const id = (value as { id?: unknown } | null | undefined)?.id;
  return typeof id === 'string' && id !== '' ? id : null;
};
