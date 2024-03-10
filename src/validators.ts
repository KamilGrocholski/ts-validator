abstract class Parser<T> {
  protected defaultValue: T | undefined;

  constructor(defaultValue?: T) {
    this.defaultValue = defaultValue;
  }

  abstract parse(value: unknown): Result<T>;
}

export type Result<T> =
  | { success: true; out: T }
  | { success: false; error: unknown };

export type Infer<T extends Parser<unknown>> = T extends Parser<infer U>
  ? U extends { [key: string]: Parser<unknown> }
    ? { [Key in keyof U]: Infer<U[Key]> }
    : U
  : never;

class OptionalV<
  T,
  TDefaultType extends T | undefined = T | undefined,
> extends Parser<T | TDefaultType> {
  constructor(
    private parser: InstanceType<typeof Parser<T>>,
    defaultValue?: TDefaultType,
  ) {
    super(defaultValue);
  }

  parse(value: unknown): Result<T | TDefaultType> {
    if (typeof value === "undefined") {
      if (this.defaultValue !== undefined)
        return { success: true, out: this.defaultValue };
      // @ts-ignore
      return { success: true, out: undefined };
    }
    return this.parser.parse(value);
  }
}

class NullableV<T> extends Parser<T | null> {
  constructor(private parser: InstanceType<typeof Parser<T>>) {
    super();
  }

  parse(value: unknown): Result<T | null> {
    if (value === null) return { success: true, out: null };
    return this.parser.parse(value);
  }
}

class NullishV<T> extends Parser<T | null | undefined> {
  constructor(private parser: InstanceType<typeof Parser<T>>) {
    super();
  }

  parse(value: unknown): Result<T | null | undefined> {
    if (value === null || value === undefined)
      return { success: true, out: value };
    return this.parser.parse(value);
  }
}

class BooleanV extends Parser<boolean> {
  constructor() {
    super();
  }

  parse(value: unknown): Result<boolean> {
    if (typeof value !== "boolean")
      return { success: false, error: "Not boolean" };
    return { success: true, out: value };
  }
}

class StringV extends Parser<string> {
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

class NumberV extends Parser<number> {
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

class ArrayV<T> extends Parser<T[]> {
  private _min: number | undefined;
  private _max: number | undefined;

  constructor(private parser: InstanceType<typeof Parser<T>>) {
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

class ObjectV<T extends { [key: string]: Parser<unknown> }> extends Parser<{
  [Key in keyof T]: Infer<T[Key]>;
}> {
  constructor(private shape: T) {
    super();
  }

  parse(value: unknown): Result<{
    [Key in keyof T]: Infer<T[Key]>;
  }> {
    if (typeof value !== "object")
      return { success: false, error: "Not object" };
    if (value === null) return { success: false, error: "Object is null" };

    const out = {} as {
      [Key in keyof T]: Infer<T[Key]>;
    };

    for (const key in this.shape) {
      // @ts-ignore
      const res = this.shape[key].parse(value[key]);
      if (!res.success) return { success: false, error: { [key]: res.error } };
      // @ts-ignore
      out[key] = res.out;
    }

    return { success: true, out };
  }
}

class OrV<T extends Parser<unknown>> extends Parser<Infer<T>> {
  constructor(private parsers: T[]) {
    super();
  }

  parse(value: unknown): Result<Infer<T>> {
    for (const parser of this.parsers) {
      const res = parser.parse(value);
      // @ts-ignore
      if (res.success) return res;
    }

    return { success: false, error: "Not in or" };
  }
}

class LiteralV<
  T extends string | number | boolean | null | undefined,
> extends Parser<T> {
  constructor(private lit: T) {
    super();
  }

  parse(value: unknown): Result<T> {
    if (value !== this.lit) return { success: false, error: `Not ${this.lit}` };
    // @ts-ignore
    return { success: true, out: value };
  }
}

type TupleVItems = [Parser<unknown>, ...Parser<unknown>[]];
type AssertArray<T> = T extends any[] ? T : never;
type TupleVOut<T extends TupleVItems | []> = AssertArray<{
  [K in keyof T]: T[K] extends Parser<unknown> ? Infer<T[K]> : never;
}>;
class TupleV<T extends TupleVItems> extends Parser<TupleVOut<T>> {
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
  parser: InstanceType<typeof Parser<T>>,
  defaultValue?: TDefault,
) {
  return new OptionalV<T, TDefault>(parser, defaultValue);
}
export function nullable<T>(parser: InstanceType<typeof Parser<T>>) {
  return new NullableV<T>(parser);
}
export function nullish<T>(parser: InstanceType<typeof Parser<T>>) {
  return new NullishV<T>(parser);
}
export function array<T>(parser: InstanceType<typeof Parser<T>>) {
  return new ArrayV<T>(parser);
}
export function object<T extends { [key: string]: Parser<unknown> }>(shape: T) {
  return new ObjectV<T>(shape);
}
export function or<T extends Parser<unknown>>(parsers: T[]) {
  return new OrV<T>(parsers);
}
export function literal<T extends string | number | boolean | null | undefined>(
  lit: T,
) {
  return new LiteralV<T>(lit);
}
export function tuple<T extends TupleVItems>(parsers: T) {
  return new TupleV<T>(parsers);
}
