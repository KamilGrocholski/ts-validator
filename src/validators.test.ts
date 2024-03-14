import { describe, expect, test } from "bun:test";

import { Result, v } from "./";

function expectNotSuccess(result: Result<unknown>) {
  expect(result.success).toBe(false);
}

function expectSuccess(result: Result<unknown>) {
  expect(result.success).toBe(true);
}

function expectOut(expectedOut: unknown, result: Result<unknown>) {
  expect(result.success).toBe(true);
  // @ts-ignore
  expect(result.out).toEqual(expectedOut);
}

function expectError(expectedError: unknown, result: Result<unknown>) {
  expect(result.success).toBe(false);
  // @ts-ignore
  expect(result.error).toEqual(expectedError);
}

describe("Validators", () => {
  describe("Unknown validator", () => {
    test("Async unknown", async () => {
      const input = "ok";
      const result = await v.unknown().parseAsync(input);
      expectOut(input, result);
    });

    test("Unknown", () => {
      const input = "ok";
      const result = v.unknown().parse(input);
      expectOut(input, result);
    });
  });

  describe("Date validator", () => {
    test("Async date", async () => {
      const input = new Date();
      const result = await v.date().parseAsync(input);
      expectOut(input, result);
    });

    test("Default date", () => {
      const input = new Date();
      const result = v.date().default(input).parse();
      expectOut(input, result);
    });

    test("Valid date", () => {
      const result = v.date().parse(new Date());
      expect(result.success).toBe(true);
    });

    test("Invalid date", () => {
      const result = v.date().parse({});
      expect(result.success).toBe(false);
    });

    test("Invalid min date", () => {
      const now = Date.now();
      const result = v
        .date()
        .min(new Date(now + 1000))
        .parse(now);
      expect(result.success).toBe(false);
    });

    test("Valid min date", () => {
      const now = Date.now();
      const result = v
        .date()
        .min(new Date(now - 1000))
        .parse(now);
      expect(result.success).toBe(true);
    });

    test("Invalid max date", () => {
      const now = Date.now();
      const result = v
        .date()
        .max(new Date(now - 1000))
        .parse(now);
      expect(result.success).toBe(false);
    });

    test("Valid max date", () => {
      const now = Date.now();
      const result = v
        .date()
        .max(new Date(now + 1000))
        .parse(now);
      expect(result.success).toBe(true);
    });

    test("Optional date", () => {
      const result = v.optional(v.date()).parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable date", () => {
      const result = v.nullable(v.date()).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish date", () => {
      const result = v.nullish(v.date()).parse(null);
      expect(result.success).toBe(true);
    });
  });

  describe("String validator", () => {
    test("Async string", async () => {
      const result = await v.string().parseAsync("ok");
      expect(result.success).toBe(true);
    });

    test("Default string", () => {
      const input = "ok";
      const result = v.string().default(input).parse();
      expectOut(input, result);
    });

    test("Valid string", () => {
      const input = "ok";
      const result = v.string().parse(input);
      expectOut(input, result);
    });

    test("Invalid string", () => {
      const input = 123;
      const result = v.string().parse(input);
      expectNotSuccess(result);
    });

    test("Optional string", () => {
      const result = v.optional(v.string()).parse(undefined);
      expectSuccess(result);
    });

    test("Nullable string", () => {
      const result = v.nullable(v.string()).parse(null);
      expectOut(null, result);
    });

    test("Nullish string", () => {
      const result = v.nullish(v.string()).parse(null);
      expectOut(null, result);
    });

    test("Transform string", () => {
      const result = v
        .optional(v.string())
        .transform((value) => {
          if (value) return 2;
          return "NIE";
        })
        .parse("n");
      expect(result.success).toBe(true);
    });
  });

  describe("Number validator", () => {
    test("Async number", async () => {
      const result = await v.number().parseAsync(1);
      expect(result.success).toBe(true);
    });

    test("Default number", () => {
      const result = v.date().default(123).parse();
      expect(result.success).toBe(true);
    });

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

    test("Nullable number", () => {
      const result = v.nullable(v.number()).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish number", () => {
      const result = v.nullish(v.number()).parse(null);
      expect(result.success).toBe(true);
    });

    test("Transform number", () => {
      const result = v
        .number()
        .transform((value) => {
          if (value > 2) return 2;
          return value;
        })
        .parse(3);
      expect(result.success).toBe(true);
    });

    test("Number with _min", () => {
      const result = v.number().min(5).parse(10);
      expect(result.success).toBe(true);
    });

    test("Number with _min (invalid)", () => {
      const result = v.number().min(5).parse(2);
      expect(result.success).toBe(false);
    });

    test("Number with _max", () => {
      const result = v.number().max(10).parse(5);
      expect(result.success).toBe(true);
    });

    test("Number with _max (invalid)", () => {
      const result = v.number().max(10).parse(15);
      expect(result.success).toBe(false);
    });

    test("Number with _gt", () => {
      const result = v.number().gt(5).parse(10);
      expect(result.success).toBe(true);
    });

    test("Number with _gt (invalid)", () => {
      const result = v.number().gt(5).parse(5);
      expect(result.success).toBe(false);
    });

    test("Number with _gte", () => {
      const result = v.number().gte(5).parse(10);
      expect(result.success).toBe(true);
    });

    test("Number with _gte (invalid)", () => {
      const result = v.number().gte(5).parse(4);
      expect(result.success).toBe(false);
    });

    test("Number with _lt", () => {
      const result = v.number().lt(10).parse(5);
      expect(result.success).toBe(true);
    });

    test("Number with _lt (invalid)", () => {
      const result = v.number().lt(10).parse(10);
      expect(result.success).toBe(false);
    });

    test("Number with _lte", () => {
      const result = v.number().lte(10).parse(5);
      expect(result.success).toBe(true);
    });

    test("Number with _lte (invalid)", () => {
      const result = v.number().lte(10).parse(11);
      expect(result.success).toBe(false);
    });

    test("Number with _int", () => {
      const result = v.number().int().parse(5);
      expect(result.success).toBe(true);
    });

    test("Number with _int (invalid)", () => {
      const result = v.number().int().parse(5.5);
      expect(result.success).toBe(false);
    });

    test("Number with _positive", () => {
      const result = v.number().positive().parse(5);
      expect(result.success).toBe(true);
    });

    test("Number with _positive (invalid)", () => {
      const result = v.number().positive().parse(-5);
      expect(result.success).toBe(false);
    });

    test("Number with _nonpositive", () => {
      const result = v.number().nonpositive().parse(-5);
      expect(result.success).toBe(true);
    });

    test("Number with _nonpositive (invalid)", () => {
      const result = v.number().nonpositive().parse(5);
      expect(result.success).toBe(false);
    });

    test("Number with _negative", () => {
      const result = v.number().negative().parse(-5);
      expect(result.success).toBe(true);
    });

    test("Number with _negative (invalid)", () => {
      const result = v.number().negative().parse(5);
      expect(result.success).toBe(false);
    });

    test("Number with _nonnegative", () => {
      const result = v.number().nonnegative().parse(5);
      expect(result.success).toBe(true);
    });

    test("Number with _nonnegative (invalid)", () => {
      const result = v.number().nonnegative().parse(-5);
      expect(result.success).toBe(false);
    });

    test("Number with _finite", () => {
      const result = v.number().finite().parse(5);
      expect(result.success).toBe(true);
    });

    test("Number with _finite (invalid)", () => {
      const result = v.number().finite().parse(Infinity);
      expect(result.success).toBe(false);
    });

    test("Safe number", () => {
      const result = v.number().safe().parse(9007199254740993);
      expect(result.success).toBe(false);
    });
  });

  describe("Object validator", () => {
    test("Async object", async () => {
      const result = await v
        .object({ a: v.string() })
        .parseAsync({ a: "String" });
      expect(result.success).toBe(true);
    });

    test("Default object", () => {
      const result = v.date().default({ ok: "tak" }).parse();
      expect(result.success).toBe(true);
    });

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

    test("Nullable object", () => {
      const result = v.nullable(v.object({ a: v.string() })).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish object", () => {
      const result = v.nullish(v.object({ a: v.string() })).parse(null);
      expect(result.success).toBe(true);
    });

    test("Transform object", () => {
      const result = v
        .object({
          name: v.string(),
          role: v.union([v.literal("USER"), v.literal("ADMIN")]),
        })
        .transform((value) => {
          if (value.role === "ADMIN") {
            return { name: value.name, isAdmin: true, vals: 8 };
          } else if (value.role === "USER") {
            return { name: value.name, isAdmin: false, vals: 5 };
          } else return null;
        })
        .parse({ name: "Ksf", role: "USER" });
      expect(result.success).toBe(true);
    });
  });

  describe("Array Validator", () => {
    test("Async array", async () => {
      const result = await v
        .array(v.string())
        .parseAsync(["string1", "string2"]);
      expect(result.success).toBe(true);
    });

    test("Default array", () => {
      const result = v.string().array().default(["tak", "nie"]).parse();
      expect(result.success).toBe(true);
    });

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

    test("Nullable array", () => {
      const result = v.nullable(v.array(v.string())).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish array", () => {
      const result = v.nullish(v.array(v.string())).parse(null);
      expect(result.success).toBe(true);
    });

    test("Transform array", () => {
      const result = v
        .array(v.string())
        .transform((array) => array.length > 2)
        .parse(["ONE", "TWO"]);
      expect(result.success).toBe(true);
    });
  });

  describe("Union Validator", () => {
    test("Async union", async () => {
      const result = await v.union([v.string(), v.number()]).parseAsync("ok");
      expect(result.success).toBe(true);
    });

    test("Default union", () => {
      const result = v.union([v.string(), v.number()]).default("ok").parse();
      expect(result.success).toBe(true);
    });

    test("Valid number union string", () => {
      const schema = v.union([v.number(), v.string()]);
      const result = schema.parse(42);
      expect(result.success).toBe(true);
    });

    test("Valid string union boolean", () => {
      const schema = v.union([v.string(), v.boolean()]);
      const result = schema.parse("hello");
      expect(result.success).toBe(true);
    });

    test("Invalid value not in union", () => {
      const schema = v.union([v.number(), v.string()]);
      const result = schema.parse(true);
      expect(result.success).toBe(false);
    });

    test("Valid non empty object union null", () => {
      const schema = v.union([v.object({ key: v.number() }), v.literal(null)]);
      const result = schema.parse(null);
      expect(result.success).toBe(true);
    });

    test("Invalid non empty object not in union", () => {
      const schema = v.union([v.object({ key: v.number() }), v.literal(null)]);
      const result = schema.parse({ key: "value" });
      expect(result.success).toBe(false);
    });

    test("Optional union", () => {
      const result = v.optional(v.union([])).parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable union", () => {
      const result = v.nullable(v.union([])).parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish union", () => {
      const result = v.nullish(v.union([v.string(), v.number()])).parse(null);
      expect(result.success).toBe(true);
    });

    test("Transfunionm union", () => {
      const result = v
        .union([v.string(), v.number()])
        .transform((value) => (typeof value === "string" ? "NIE" : "TAK"))
        .parse("ok");
      expect(result.success).toBe(true);
    });
  });

  describe("Literal Validator", () => {
    test("Async literal", async () => {
      const result = await v.literal("ok").parseAsync("ok");
      expect(result.success).toBe(true);
    });

    test("Default literal", () => {
      const result = v
        .literal("tak")
        .default("nie" as const)
        .parse();
      expect(result.success).toBe(true);
    });

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

    test("Transform literal", () => {
      const result = v
        .literal("okej")
        .transform(() => 234)
        .parse("okej");
      expect(result.success).toBe(true);
    });
  });

  describe("Tuple Validator", () => {
    test("Async tuple", async () => {
      const result = await v.tuple([v.string()]).parseAsync(["ok"]);
      expect(result.success).toBe(true);
    });

    test("Default tuple", () => {
      const result = v
        .tuple([v.number(), v.string()])
        .default([1, "ok"] as [number, string])
        .parse();
      expect(result.success).toBe(true);
    });

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

    test("Transform tuple", () => {
      const result = v
        .tuple([v.string(), v.number()])
        .transform(([str, num]) => [num, str] as [number, string])
        .parse(["okej", 1]);
      expect(result.success).toBe(true);
    });
  });

  describe("Record validator", () => {
    test("Async record", async () => {
      const result = await v
        .record(v.string())
        .parseAsync({ key1: "value1", key2: "value2" });
      expect(result.success).toBe(true);
    });

    test("Default record", () => {
      const result = v
        .record(v.string())
        .default({ key1: "value1", key2: "value2" })
        .parse();
      expect(result.success).toBe(true);
    });

    test("Valid record", () => {
      const result = v
        .record(v.string())
        .parse({ key1: "value1", key2: "value2" });
      expect(result.success).toBe(true);
    });

    test("Invalid record", () => {
      const result = v
        .record(v.number())
        .parse({ key1: "value1", key2: "value2" });
      expect(result.success).toBe(false);
    });

    test("Optional record", () => {
      const schema = v.optional(v.record(v.number()));
      const result = schema.parse(undefined);
      expect(result.success).toBe(true);
    });

    test("Nullable record", () => {
      const schema = v.nullable(v.record(v.number()));
      const result = schema.parse(null);
      expect(result.success).toBe(true);
    });

    test("Nullish record", () => {
      const schema = v.nullish(v.record(v.number()));
      const result = schema.parse(null);
      expect(result.success).toBe(true);
    });
  });

  describe("Nulla validator", () => {
    test("Null async", async () => {
      const result = await v.nulla().parseAsync(null);
      expect(result.success).toBe(true);
    });

    test("Valid null", () => {
      const result = v.nulla().parse(null);
      expect(result.success).toBe(true);
    });

    test("Invalid null", () => {
      const result = v.nulla().parse(2);
      expect(result.success).toBe(false);
    });

    test("Empty object", () => {
      const result = v.nulla().parse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Discriminated union validator", () => {
    test("Match successfully", () => {
      const schema = v.discriminatedUnion("type", [
        v.object({ type: v.literal("add"), input: v.string() }),
        v.object({ type: v.literal("remove"), input: v.number() }),
        v.object({ type: v.literal("reset"), input: v.boolean() }),
      ]);
      const input1 = { type: "add", input: "okej" };
      const result1 = schema.parse(input1);
      expectOut(input1, result1);

      const input2 = { type: "remove", input: 2 };
      const result2 = schema.parse(input2);
      expectOut(input2, result2);

      const input3 = { type: "reset", input: true };
      const result3 = schema.parse(input3);
      expectOut(input3, result3);
    });

    test("Match error", () => {
      const schema = v.discriminatedUnion("type", [
        v.object({ type: v.literal("add"), input: v.string() }),
        v.object({ type: v.literal("remove"), input: v.number() }),
        v.object({ type: v.literal("reset"), input: v.boolean() }),
      ]);
      const input1 = { type: "add", input: true };
      const result1 = schema.parse(input1);
      expectNotSuccess(result1);

      const input2 = { type: "remove", input: "okej" };
      const result2 = schema.parse(input2);
      expectNotSuccess(result2);

      const input3 = { type: "reset", input: null };
      const result3 = schema.parse(input3);
      expectNotSuccess(result3);
    });
  });
});
