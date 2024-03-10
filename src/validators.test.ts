import { describe, expect, test } from "bun:test";

import { v } from "./";

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
  });
});
