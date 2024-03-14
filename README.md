# ts-validator

## To install dependencies:

```bash
bun install
```

## To test

```bash
bun test
```

### Result type

```typescript
export type Result<T> =
  | { success: true; out: T }
  | { success: false; error: unknown };
```

### InferIn type

```typescript
const userSchema = v.object({
  name: v.string(),
  age: v.number().transform((v) => (v > 2 ? "Y" : "N")),
});
type User = InferIn<typeof userSchema>; // { name: string, age: number }
```

### InferOut type

```typescript
const userSchema = v.object({
  name: v.string(),
  age: v.number().transform((v) => (v > 2 ? "Y" : "N")),
});
type User = InferOut<typeof userSchema>; // { name: string, age: "Y" | "N" }
```

### DateV

```typescript
const schema = v.date();
const result = schema.parse(new Date("2024-03-10T21:18:51.222Z"));
console.log(result); // { success: true, out: "2024-03-10T21:18:51.222Z" }
```

### BooleanV

```typescript
const schema = v.boolean();
const result = schema.parse(true);
console.log(result); // { success: true, out: true }
```

### StringV

```typescript
const schema = v.string().min(1).max(6);
const result = schema.parse("String");
console.log(result); // { success: true, out: "String" }
```

### NumberV

```typescript
const schema = v.number().min(0).max(10);
const result = schema.parse(5);
console.log(result); // { success: true, out: 5 }
```

### ArrayV

```typescript
const schema = v.array(v.number());
const result = schema.parse([1, 2, 3, 4]);
console.log(result); // { success: true, out: [1, 2, 3, 4] }
```

### ObjectV

```typescript
const schema = v.object({
  a: v.string(),
  b: v.number(),
});
const result = schema.parse({
  a: "String",
  b: 1234,
});
console.log(result); // { success: true, out: { a: "String", b: 1234 } }
```

### UnionV

```typescript
const schema = v.union([v.number(), v.string()]);
const result1 = schema.parse([1]);
const result2 = schema.parse(["String"]);
console.log(result1); // { success: true, out: [1] }
console.log(result2); // { success: true, out: ["String"] }
```

### LiteralV

```typescript
const schema = v.literal("String");
const result = schema.parse("String");
console.log(result); // { success: true, out: "String" }
```

### TupleV

```typescript
const schema = v.tuple([v.string(), v.number()]);
const result = schema.parse(["String", 1]);
console.log(result); // { success: true, out: ["String", 1] }
```

### RecordV

```typescript
const schema = v.record(v.string());
const result = schema.parse({ key1: "value1", key2: "value2" });
console.log(result); // { success: true, out: { key1: "value1", key2: "value2" } }
```

### OptionalV

```typescript
const schema = v.optional(v.string());
const result = schema.parse(undefined);
console.log(result); // { success: true, out: undefined }
```

### NullableV

```typescript
const schema = v.nullable(v.string());
const result = schema.parse(null);
console.log(result); // { success: true, out: null }
```

### NullishV

```typescript
const schema = v.nullish(v.string());
const result1 = schema.parse(null);
const result2 = schema.parse(undefined);
console.log(result1); // { success: true, out: null }
console.log(result2); // { success: true, out: undefined }
```

### TransformV

```typescript
const schema = v.number().transform((value) => (value > 5 ? "NO" : "YES"));
const result = schema.parse(2);
type Schema = InferOut<typeof schema>; // "NO" | "YES"
console.log(result); // { success: true, out: "YES" }
```

### UnknownV

```typescript
const schema = v.unknown();
const result = schema.parse("ok");
type Schema = InferOut<typeof schema>; // unknown
console.log(result); // { success: true, out: "ok" }
```

### Default

```typescript
const schema = v.string().default("default string");
const result = schema.parse(undefined);
type Schema = InferOut<typeof schema>; // string
console.log(result); // { success: true, out: "default string" }
```

### parseAsync

```typescript
const schema = v.number();
const result = await schema.parseAsync(2);
type Schema = InferOut<typeof schema>; // number
console.log(result); // { success: true, out: 2 }
```

### UnknownV

```typescript
const schema = v.unknown();
const result = schema.parse("string value");
type Schema = InferOut<typeof schema>; // unknown
console.log(result); // { success: true, out: "string value" }
```

### DiscriminatedUnionV

```typescript
type UserActionIn = InferIn<typeof userActionSchema>;
type UserActionOut = InferOut<typeof userActionSchema>;

const userActionSchema = v.discriminatedUnion("type", [
  v.object({
    type: v.literal("add"),
    input: v.object({ name: v.string(), age: v.number() }),
  }),
  v.object({
    type: v.literal("remove"),
    input: v.object({ id: v.number() }),
  }),
  v.object({
    type: v.literal("update"),
    input: v.object({
      id: v.number(),
      name: v.string().optional(),
      age: v.number().optional(),
    }),
  }),
]);
```

This project was created using `bun init` in bun v1.0.11. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
