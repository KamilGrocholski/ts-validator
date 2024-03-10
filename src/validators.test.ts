import { describe, expect, test } from "bun:test";

import { Infer, v } from "./";

const o = v.optional(v.string(), "okej");
type V = Infer<typeof o>;

describe("Validators", () => {
  describe("String validator", () => {
    test("Valid string", () => {
      const result = v.string().parse("hello");
      expect(result.success).toBe(true);
    });

    test("Invalid string", () => {
      const result = v.string().parse(123);
      expect(result.success).toBe(false);
    });

    test("Optional string", () => {
      const result = v.optional(v.string()).parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Optional string with default", () => {
      const result = v.optional(v.string(), "okej").parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable string", () => {
      const result = v.nullable(v.string()).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish string", () => {
      const result = v.nullish(v.string()).parse(null);
      expect(result.success).toBe(true);
    });
  });

  describe("Number validator", () => {
    test("Valid number", () => {
      const result = v.number().parse(42);
      expect(result.success).toBe(true);
    });

    test("Invalid number", () => {
      const result = v.number().parse("not a number");
      expect(result.success).toBe(false);
    });

    test("Optional number", () => {
      const result = v.optional(v.number()).parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Optional number with default", () => {
      const result = v.optional(v.number(), 1).parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable number", () => {
      const result = v.nullable(v.number()).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish number", () => {
      const result = v.nullish(v.number()).parse(null);
      expect(result.success).toBe(true);
    });
  });

  describe("Object validator", () => {
    test("Valid object with string and number properties", () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      });
      const result = schema.parse({ name: "John", age: 30 });
      expect(result.success).toBe(true);
    });

    test("Invalid object with missing property", () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      });
      const result = schema.parse({ name: "John" });
      expect(result.success).toBe(false);
    });

    test("Invalid object with invalid property value", () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      });
      const result = schema.parse({ name: "John", age: "thirty" });
      expect(result.success).toBe(false);
    });

    test("Valid nested object", () => {
      const schema = v.object({
        address: v.object({
          city: v.string(),
          zip: v.number(),
        }),
      });
      const result = schema.parse({
        address: { city: "New York", zip: 12345 },
      });
      expect(result.success).toBe(true);
    });

    test("Invalid nested object", () => {
      const schema = v.object({
        address: v.object({
          city: v.string(),
          zip: v.number(),
        }),
      });
      const result = schema.parse({
        address: { city: "New York", zip: "12345" },
      });
      expect(result.success).toBe(false);
    });

    test("Mixed properties", () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
        address: v.object({
          city: v.string(),
          zip: v.number(),
        }),
      });
      const result = schema.parse({
        name: "John",
        age: 30,
        address: { city: "New York", zip: 12345 },
      });
      expect(result.success).toBe(true);
    });

    test("Optional object", () => {
      const result = v.optional(v.object({ a: v.string() })).parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Optional object with default", () => {
      const result = v
        .optional(v.object({ a: v.string() }), { a: "okej" })
        .parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable object", () => {
      const result = v.nullable(v.object({ a: v.string() })).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish object", () => {
      const result = v.nullish(v.object({ a: v.string() })).parse(null);
      expect(result.success).toBe(true);
    });
  });

  describe("Array Validator", () => {
    test("Valid array with numbers", () => {
      const schema = v.array(v.number());
      const result = schema.parse([1, 2, 3]);
      expect(result.success).toBe(true);
    });

    test("Invalid array with mixed types", () => {
      const schema = v.array(v.number());
      const result = schema.parse([1, "two", 3]);
      expect(result.success).toBe(false);
    });

    test("Valid array with nested objects", () => {
      const schema = v.array(
        v.object({
          name: v.string(),
          age: v.number(),
        }),
      );
      const result = schema.parse([
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ]);
      expect(result.success).toBe(true);
    });

    test("Invalid array with invalid nested objects", () => {
      const schema = v.array(
        v.object({
          name: v.string(),
          age: v.number(),
        }),
      );
      const result = schema.parse([
        { name: "John", age: 30 },
        { name: "Jane", age: "twenty-five" },
      ]);
      expect(result.success).toBe(false);
    });

    test("Array of optional strings", () => {
      const schema = v.array(v.optional(v.string()));
      const result = schema.parse(["hello", undefined, "world"]);
      expect(result.success).toBe(true);
    });

    test("Array with minimum length", () => {
      const schema = v.array(v.number()).min(3);
      const result = schema.parse([1, 2]);
      expect(result.success).toBe(false);
    });

    test("Array with maximum length", () => {
      const schema = v.array(v.number()).max(3);
      const result = schema.parse([1, 2, 3, 4]);
      expect(result.success).toBe(false);
    });

    test("Optional array", () => {
      const result = v.optional(v.array(v.string())).parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Optional array with default", () => {
      const result = v
        .optional(v.array(v.string()), ["okej", "okej2"])
        .parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable array", () => {
      const result = v.nullable(v.array(v.string())).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish array", () => {
      const result = v.nullish(v.array(v.string())).parse(null);
      expect(result.success).toBe(true);
    });
  });

  describe("Or Validator", () => {
    test("Valid number or string", () => {
      const schema = v.or([v.number(), v.string()]);
      const result = schema.parse(42);
      expect(result.success).toBe(true);
    });

    test("Valid string or boolean", () => {
      const schema = v.or([v.string(), v.boolean()]);
      const result = schema.parse("hello");
      expect(result.success).toBe(true);
    });

    test("Invalid value not in or", () => {
      const schema = v.or([v.number(), v.string()]);
      const result = schema.parse(true);
      expect(result.success).toBe(false);
    });

    test("Valid non empty object or null", () => {
      const schema = v.or([v.object({ key: v.number() }), v.literal(null)]);
      const result = schema.parse(null);
      expect(result.success).toBe(true);
    });

    test("Invalid non empty object not in or", () => {
      const schema = v.or([v.object({ key: v.number() }), v.literal(null)]);
      const result = schema.parse({ key: "value" });
      expect(result.success).toBe(false);
    });

    test("Optional or", () => {
      const result = v.optional(v.or([])).parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Optional or with default", () => {
      const result = v
        .optional(v.or([v.string(), v.number()]), "okej")
        .parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable or", () => {
      const result = v.nullable(v.or([])).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish or", () => {
      const result = v.nullish(v.or([v.string(), v.number()])).parse(null);
      expect(result.success).toBe(true);
    });
  });

  describe("Literal Validator", () => {
    test("Valid literal value", () => {
      const schema = v.literal("hello");
      const result = schema.parse("hello");
      expect(result.success).toBe(true);
    });

    test("Invalid literal value", () => {
      const schema = v.literal(42);
      const result = schema.parse("hello");
      expect(result.success).toBe(false);
    });

    test("Valid null literal", () => {
      const schema = v.literal(null);
      const result = schema.parse(null);
      expect(result.success).toBe(true);
    });

    test("Invalid null literal", () => {
      const schema = v.literal(null);
      const result = schema.parse(undefined);
      expect(result.success).toBe(false);
    });

    test("Optional literal", () => {
      const result = v.optional(v.literal(1)).parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable literal", () => {
      const result = v.nullable(v.literal(1)).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish literal", () => {
      const result = v.nullish(v.literal("okej")).parse(null);
      expect(result.success).toBe(true);
    });
  });

  describe("Tuple Validator", () => {
    test("Valid tuple with numbers", () => {
      const schema = v.tuple([v.number(), v.number()]);
      const result = schema.parse([1, 2]);
      expect(result.success).toBe(true);
    });

    test("Invalid tuple with mixed types", () => {
      const schema = v.tuple([v.number(), v.string()]);
      const result = schema.parse(["two", 1]);
      expect(result.success).toBe(false);
    });

    test("Valid tuple with optional string", () => {
      const schema = v.tuple([v.string(), v.optional(v.string())]);
      const result = schema.parse(["hello", undefined]);
      expect(result.success).toBe(true);
    });

    test("Invalid tuple with missing values", () => {
      const schema = v.tuple([v.string(), v.string()]);
      const result = schema.parse(["hello"]);
      expect(result.success).toBe(false);
    });

    test("Valid tuple with nested objects", () => {
      const schema = v.tuple([
        v.object({ name: v.string(), age: v.number() }),
        v.object({ name: v.string(), age: v.number() }),
      ]);
      const result = schema.parse([
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ]);
      expect(result.success).toBe(true);
    });

    test("Invalid tuple with invalid nested objects", () => {
      const schema = v.tuple([
        v.object({ name: v.string(), age: v.number() }),
        v.object({ name: v.string(), age: v.number() }),
      ]);
      const result = schema.parse([
        { name: "John", age: 30 },
        { name: "Jane", age: "twenty-five" },
      ]);
      expect(result.success).toBe(false);
    });

    test("Optional tuple", () => {
      const schema = v.optional(v.tuple([v.string(), v.number()]));
      const result = schema.parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Optional tuple with default", () => {
      const result = v
        .optional(v.tuple([v.string(), v.number()]), ["okej", 1])
        .parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable tuple", () => {
      const schema = v.nullable(v.tuple([v.string(), v.number()]));
      const result = schema.parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish tuple", () => {
      const result = v.nullish(v.tuple([v.number(), v.string()])).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nested tuples", () => {
      const schema = v.tuple([
        v.tuple([v.number(), v.string()]),
        v.tuple([v.boolean()]),
      ]);
      const result = schema.parse([[42, "hello"], [true]]);
      expect(result.success).toBe(true);
    });
  });
});
