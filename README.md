# ts-validator

### Result type

```typescript
export type Result<T> =
  | { success: true; out: T }
  | { success: false; error: unknown };
```

### InferIn type

```typescript
not implemented
```

### InferOut type

```typescript
const userSchema = v.object({ name: v.string(), age: v.number() });
type User = InferOut<typeof userSchema>; // { name: string, age: number }
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
const schema = v.object(
  v.object({
    a: v.string(),
    b: v.number(),
  }),
);
const result = schema.parse({
  a: "String",
  b: 1234,
});
console.log(result); // { success: true, out: { a: "String", b: 1234 } }
```

### OrV

```typescript
const schema = v.or([v.number(), v.string()]);
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

### OptionalV

```typescript
const schema = v.optional(v.string());
const result = schema.parse(undefined);
console.log(result); // { success: true, out: undefined }
```

### OptionalV with default

```typescript
const schema = v.optional(v.string(), "okej");
const result = schema.parse(undefined);
type Schema = InferOut<typeof schema>; // string
console.log(result); // { success: true, out: "okej" }
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

### TranformV

```typescript
const schema = v.number().tranform((value) => (value > 5 ? "NO" : "YES"));
const result = schema.parse(2);
type Schema = InferOut<typeof schema>; // "NO" | "YES"
console.log(result); // { success: true, out: "YES" }
```

## To install dependencies:

```bash
bun install
```

To test:

```bash
bun test
```

This project was created using `bun init` in bun v1.0.11. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
