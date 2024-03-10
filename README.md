# ts-validator

### Result type

```
export type Result<T> =
  | { success: true; out: T }
  | { success: false; error: unknown };
```

### Infer type

```
const userSchema = v.object({ name: v.string(), age: v.number() })
type User = Infer<typeof userSchema> // { name: string, age: number }
```

### BooleanV

```
const schema = v.boolean();
const result = schema.parse(true);
console.log(result); // { success: true, out: true }
```

### StringV

```
const schema = v.string().min(1).max(6);
const result = schema.parse("String");
console.log(result); // { success: true, out: "String" }
```

### NumberV

```
const schema = v.number().min(0).max(10);
const result = schema.parse(5);
console.log(result); // { success: true, out: 5 }
```

### ArrayV

```
const schema = v.array(v.number())
const result = schema.parse([1, 2, 3, 4]);
console.log(result); // { success: true, out: [1, 2, 3, 4] }
```

### ObjectV

```
const schema = v.object(v.object({
    a: v.string(),
    b: v.number(),
}));
const result = schema.parse({
    a: "String",
    b: 1234,
});
console.log(result); // { success: true, out: { a: "String", b: 1234 } }
```

### OrV

```
const schema = v.or([v.number(), v.string()]);
const result1 = schema.parse([1]);
const result2 = schema.parse(["String"]);
console.log(result1); // { success: true, out: [1] }
console.log(result2); // { success: true, out: ["String"] }
```

### LiteralV

```
const schema = v.literal("String");
const result = schema.parse("String");
console.log(result); // { success: true, out: "String" }
```

### TupleV

```
const schema = v.tuple([v.string(), v.number()]);
const result = schema.parse(["String", 1]);
console.log(result); // { success: true, out: ["String", 1] }
```

### Optional

```
const schema = v.optional(v.string());
const result = schema.parse(undefined);
console.log(result); // { success: true, out: undefined }
```

### Nullable

```
const schema = v.nullable(v.string());
const result = schema.parse(null);
console.log(result); // { success: true, out: null }
```

### Nullish

```
const schema = v.nullish(v.string());
const result1 = schema.parse(null);
const result2 = schema.parse(undefined);
console.log(result1); // { success: true, out: null }
console.log(result2); // { success: true, out: undefined }
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
