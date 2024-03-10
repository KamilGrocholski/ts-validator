export type Result<TOut> =
  | { success: true; out: TOut }
  | { success: false; error: unknown };

export type InferIn<T extends Parser<unknown, unknown>> = T extends Parser<
  infer U,
  infer _
>
  ? U extends { [key: string]: Parser<unknown, unknown> }
    ? { [Key in keyof U]: InferIn<U[Key]> }
    : U
  : never;

export type InferOut<T extends Parser<unknown, unknown>> = T extends Parser<
  infer _,
  infer U
>
  ? U extends { [key: string]: Parser<unknown, unknown> }
    ? { [Key in keyof U]: InferOut<U[Key]> }
    : U
  : never;

abstract class Parser<TIn, TOut> {
  protected defaultValue: TOut | undefined;

  constructor(defaultValue?: TOut) {
    this.defaultValue = defaultValue;
  }

  abstract parse(value: unknown): Result<TOut>;

  async parseAsync(value: unknown): Promise<Result<TOut>> {
    return Promise.resolve(this.parse(value));
  }

  transform<U>(transformer: (value: TOut) => U): Parser<TIn, U> {
    return new TransformV<TIn, TOut, U>(this, transformer);
  }
}

class TransformV<TIn, TOut, U> extends Parser<TIn, U> {
  constructor(
    private parser: Parser<TIn, TOut>,
    private transformer: (value: TOut) => U,
  ) {
    super();
  }

  parse(value: TIn): Result<U> {
    const parsedResult = this.parser.parse(value);
    if (!parsedResult.success) {
      return parsedResult;
    }
    const transformedValue = this.transformer(parsedResult.out);
    return { success: true, out: transformedValue };
  }
}

class OptionalV<
  T,
  TDefaultType extends T | undefined = T | undefined,
> extends Parser<T | TDefaultType, T | TDefaultType> {
  constructor(
    private parser: InstanceType<typeof Parser<T, T>>,
    defaultValue?: TDefaultType,
  ) {
    super(defaultValue);
  }

  parse(value: unknown): Result<T | TDefaultType> {
    if (typeof value === "undefined") {
      if (this.defaultValue !== undefined)
        return { success: true, out: this.defaultValue };
      return { success: true, out: undefined as TDefaultType };
    }
    return this.parser.parse(value);
  }
}

class NullableV<T> extends Parser<T | null, T | null> {
  constructor(private parser: InstanceType<typeof Parser<T, T>>) {
    super();
  }

  parse(value: T | null): Result<T | null> {
    if (value === null) return { success: true, out: null };
    return this.parser.parse(value);
  }
}

class NullishV<T> extends Parser<T | null | undefined, T | null | undefined> {
  constructor(private parser: InstanceType<typeof Parser<unknown, T>>) {
    super();
  }

  parse(value: unknown): Result<T | null | undefined> {
    if (value === null || value === undefined)
      return { success: true, out: value };
    return this.parser.parse(value);
  }
}

class BooleanV extends Parser<boolean, boolean> {
  constructor() {
    super();
  }

  parse(value: unknown): Result<boolean> {
    if (typeof value !== "boolean")
      return { success: false, error: "Not boolean" };
    return { success: true, out: value };
  }
}

class StringV extends Parser<string, string> {
  private _min: number | undefined;
  private _max: number | undefined;
  constructor() {
    super();
  }

  parse(value: unknown): Result<string> {
    if (typeof value !== "string")
      return { success: false, error: "Not string" };
    if (this._min !== undefined && value.length < this._min)
      return { success: false, error: `String length < ${this._min}` };
    if (this._max !== undefined && value.length > this._max)
      return { success: false, error: `String length > ${this._max}` };
    return { success: true, out: value };
  }

  min(len: number) {
    this._min = len;
    return this;
  }

  max(len: number) {
    this._max = len;
    return this;
  }
}

class NumberV extends Parser<number, number> {
  private _min: number | undefined;
  private _max: number | undefined;
  constructor() {
    super();
  }

  parse(value: unknown): Result<number> {
    if (typeof value !== "number")
      return { success: false, error: "Not number" };
    if (this._min !== undefined && value < this._min)
      return { success: false, error: `Number < ${this._min}` };
    if (this._max !== undefined && value > this._max)
      return { success: false, error: `Number > ${this._max}` };
    return { success: true, out: value };
  }

  min(len: number) {
    this._min = len;
    return this;
  }

  max(len: number) {
    this._max = len;
    return this;
  }
}

class ArrayV<T> extends Parser<T[], T[]> {
  private _min: number | undefined;
  private _max: number | undefined;

  constructor(private parser: InstanceType<typeof Parser<unknown, T>>) {
    super();
  }

  parse(value: unknown): Result<T[]> {
    if (!Array.isArray(value)) return { success: false, error: "Not array" };
    if (this._min !== undefined && value.length < this._min)
      return { success: false, error: `Array length < ${this._min}` };
    if (this._max !== undefined && value.length > this._max)
      return { success: false, error: `Array length > ${this._max}` };

    const parsed = [];

    let i = -1;
    for (const el of value) {
      i++;
      const res = this.parser.parse(el);
      if (!res.success)
        return { success: false, error: `index: ${i}, [${res.error}]` };
      parsed.push(res.out);
    }

    // @ts-ignore
    return { success: true, out: parsed };
  }

  min(len: number) {
    this._min = len;
    return this;
  }

  max(len: number) {
    this._max = len;
    return this;
  }
}

class ObjectV<
  T extends { [key: string]: Parser<unknown, unknown> },
> extends Parser<
  {
    [Key in keyof T]: InferIn<T[Key]>;
  },
  {
    [Key in keyof T]: InferOut<T[Key]>;
  }
> {
  constructor(private shape: T) {
    super();
  }

  parse(value: unknown): Result<{
    [Key in keyof T]: InferOut<T[Key]>;
  }> {
    if (typeof value !== "object")
      return { success: false, error: "Not object" };
    if (value === null) return { success: false, error: "Object is null" };

    const out = {} as {
      [Key in keyof T]: InferOut<T[Key]>;
    };

    for (const key in this.shape) {
      // @ts-ignore
      const res = this.shape[key].parse(value[key]);
      if (!res.success)
        return { success: false, error: `{ field: [${key}]: ${res.error} }` };
      // @ts-ignore
      out[key] = res.out;
    }

    return { success: true, out };
  }
}

class OrV<T extends Parser<unknown, unknown>> extends Parser<
  InferIn<T>,
  InferOut<T>
> {
  constructor(private parsers: T[]) {
    super();
  }

  parse(value: unknown): Result<InferOut<T>> {
    for (const parser of this.parsers) {
      const res = parser.parse(value);
      // @ts-ignore
      if (res.success) return res;
    }

    return { success: false, error: "Not in or" };
  }
}

class LiteralV<
  const T extends string | number | boolean | null | undefined,
> extends Parser<T, T> {
  constructor(private lit: T) {
    super();
  }

  parse(value: unknown): Result<T> {
    if (value !== this.lit) return { success: false, error: `Not ${this.lit}` };
    // @ts-ignore
    return { success: true, out: value };
  }
}

type TupleVItems = [Parser<unknown, unknown>, ...Parser<unknown, unknown>[]];
type AssertArray<T> = T extends unknown[] ? T : never;
type TupleVOut<T extends TupleVItems | []> = AssertArray<{
  [K in keyof T]: T[K] extends Parser<unknown, unknown>
    ? InferOut<T[K]>
    : never;
}>;
type TupleVIn<T extends TupleVItems | []> = AssertArray<{
  [K in keyof T]: T[K] extends Parser<unknown, unknown> ? InferIn<T[K]> : never;
}>;
class TupleV<T extends TupleVItems> extends Parser<TupleVIn<T>, TupleVOut<T>> {
  constructor(private parsers: T) {
    super();
  }

  parse(value: unknown): Result<TupleVOut<T>> {
    if (!Array.isArray(value)) return { success: false, error: `Not array` };
    if (value.length !== this.parsers.length)
      return { success: false, error: `Not exact length` };

    const out = [];

    for (let i = 0; i < this.parsers.length; ++i) {
      const res = this.parsers[i].parse(value[i]);
      if (!res.success) return { success: false, error: "" };
      out[i] = res.out;
    }

    // @ts-ignore
    return { success: true, out };
  }
}

class RecordV<T extends Parser<unknown, unknown>> extends Parser<
  {
    [key: string]: InferIn<T>;
  },
  {
    [key: string]: InferOut<T>;
  }
> {
  constructor(private parser: T) {
    super();
  }

  parse(value: unknown): Result<{ [key: string]: InferOut<T> }> {
    if (typeof value !== "object") return { success: false, error: null };
    if (value === null) return { success: false, error: null };
    const out = {};

    for (const key in value) {
      // @ts-ignore
      const res = this.parser.parse(value[key]);
      if (!res.success) return { success: false, error: null };
      // @ts-ignore
      out[key] = res.out;
    }

    // @ts-ignore
    return { success: true, out };
  }
}

export function boolean() {
  return new BooleanV();
}
export function number() {
  return new NumberV();
}
export function string() {
  return new StringV();
}
export function optional<T, TDefault extends T | undefined = T | undefined>(
  parser: InstanceType<typeof Parser<T, T>>,
  defaultValue?: TDefault,
) {
  return new OptionalV<T, TDefault>(parser, defaultValue);
}
export function nullable<T>(parser: InstanceType<typeof Parser<T, T>>) {
  return new NullableV<T>(parser);
}
export function nullish<T>(parser: InstanceType<typeof Parser<T, T>>) {
  return new NullishV<T>(parser);
}
export function array<T>(parser: InstanceType<typeof Parser<T, T>>) {
  return new ArrayV<T>(parser);
}
export function object<T extends { [key: string]: Parser<unknown, unknown> }>(
  shape: T,
) {
  return new ObjectV<T>(shape);
}
export function or<T extends Parser<unknown, unknown>>(parsers: T[]) {
  return new OrV<T>(parsers);
}
export function literal<
  const T extends string | number | boolean | null | undefined,
>(lit: T) {
  return new LiteralV<T>(lit);
}
export function tuple<T extends TupleVItems>(parsers: T) {
  return new TupleV<T>(parsers);
}
export function record<T extends Parser<unknown, unknown>>(parser: T) {
  return new RecordV<T>(parser);
}
