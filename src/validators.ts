export type Result<TOut> =
  | { success: true; out: TOut }
  | { success: false; error: unknown };

export type UnknownObjectVParser = {
  [Key: string]: UnknownVParser;
};
export type UnknownVParser = Parser<unknown, unknown>;

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
type UndefinedProps<T extends object> = {
  [K in keyof T as undefined extends T[K] ? K : never]?: T[K];
};
type MakeUndefinedFieldsOptional<T extends object> = Expand<
  UndefinedProps<T> & Omit<T, keyof UndefinedProps<T>>
>;

export type InferIn<T extends UnknownVParser> = T extends Parser<
  infer U,
  infer _
>
  ? U extends UnknownObjectVParser
    ? MakeUndefinedFieldsOptional<{ [Key in keyof U]-?: InferIn<U[Key]> }>
    : U
  : never;

export type InferOut<T extends UnknownVParser> = T extends Parser<
  infer _,
  infer U
>
  ? U extends UnknownObjectVParser
    ? MakeUndefinedFieldsOptional<{ [Key in keyof U]-?: InferOut<U[Key]> }>
    : U
  : never;

export abstract class Parser<TIn, TOut> {
  protected defaultValue?: TOut;

  constructor(defaultValue?: TOut) {
    this.defaultValue = defaultValue;
  }

  abstract parse(value?: unknown): Result<TOut>;

  async parseAsync(value?: unknown): Promise<Result<TOut>> {
    return Promise.resolve(this.parse(value));
  }

  transform<U>(transformer: (value: TOut) => U): Parser<TIn, U> {
    return new TransformV<TIn, TOut, U>(this, transformer);
  }

  optional() {
    return new OptionalV<TIn, TOut>(this);
  }

  nullable() {
    return new NullableV<TIn, TOut>(this);
  }

  nullish() {
    return new NullishV<TIn, TOut>(this);
  }

  array() {
    return new ArrayV<TIn, TOut>(this);
  }

  default<U>(defaultValue: U) {
    return new OptionalV<TIn, TOut>(this).transform((v) =>
      v === undefined ? defaultValue : v,
    );
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

class OptionalV<TIn, TOut> extends Parser<TIn | undefined, TOut | undefined> {
  constructor(private parser: InstanceType<typeof Parser<TIn, TOut>>) {
    super();
  }

  parse(value: unknown): Result<TOut | undefined> {
    if (typeof value === "undefined") {
      return { success: true, out: undefined };
    }
    return this.parser.parse(value as TIn);
  }
}

class NullableV<TIn, TOut> extends Parser<TIn | null, TOut | null> {
  constructor(private parser: InstanceType<typeof Parser<TIn, TOut>>) {
    super();
  }

  parse(value: unknown): Result<TOut | null> {
    if (value === null) return { success: true, out: null };
    return this.parser.parse(value);
  }
}

class NullishV<TIn, TOut> extends Parser<
  TIn | null | undefined,
  TOut | null | undefined
> {
  constructor(private parser: InstanceType<typeof Parser<TIn, TOut>>) {
    super();
  }

  parse(value: unknown): Result<TOut | null | undefined> {
    if (value === null || value === undefined)
      return { success: true, out: value };
    return this.parser.parse(value);
  }
}

class DateV extends Parser<Date, Date> {
  private _min: Date | undefined;
  private _max: Date | undefined;

  constructor() {
    super();
  }

  parse(value: unknown): Result<Date> {
    // @ts-ignore
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { success: false, error: "Invalid date format" };
    }
    if (this._min && date < this._min) {
      return {
        success: false,
        error: "Date < min",
      };
    }

    if (this._max && date > this._max) {
      return {
        success: false,
        error: "Date > max",
      };
    }
    return { success: true, out: date };
  }

  min(date: Date) {
    this._min = date;
    return this;
  }

  max(date: Date) {
    this._max = date;
    return this;
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
  private _gt: number | undefined;
  private _gte: number | undefined;
  private _lt: number | undefined;
  private _lte: number | undefined;
  private _int: boolean = false;
  private _positive: boolean = false;
  private _nonpositive: boolean = false;
  private _negative: boolean = false;
  private _nonnegative: boolean = false;
  private _finite: boolean = false;
  private _safe: boolean = false;

  constructor() {
    super();
  }

  parse(value: unknown): Result<number> {
    if (typeof value !== "number")
      return { success: false, error: "Not number" };

    const parsedValue = value as number;

    if (this._int && !Number.isInteger(parsedValue))
      return { success: false, error: "Not integer" };

    if (this._safe && !Number.isSafeInteger(parsedValue))
      return { success: false, error: "Not safe integer" };

    if (this._finite && !Number.isFinite(parsedValue))
      return { success: false, error: "Not finite" };

    if (this._gt !== undefined && parsedValue <= this._gt)
      return { success: false, error: `Number not gt ${this._gt}` };

    if (this._gte !== undefined && parsedValue < this._gte)
      return { success: false, error: `Number not gte ${this._gte}` };

    if (this._lt !== undefined && parsedValue >= this._lt)
      return { success: false, error: `Number not lt ${this._lt}` };

    if (this._lte !== undefined && parsedValue > this._lte)
      return { success: false, error: `Number not lte ${this._lte}` };

    if (this._min !== undefined && parsedValue < this._min)
      return { success: false, error: `Number < ${this._min}` };

    if (this._max !== undefined && parsedValue > this._max)
      return { success: false, error: `Number > ${this._max}` };

    if (this._positive && parsedValue <= 0)
      return { success: false, error: `Number not positive` };

    if (this._nonpositive && parsedValue > 0)
      return { success: false, error: `Number not non-positive` };

    if (this._negative && parsedValue >= 0)
      return { success: false, error: `Number not negative` };

    if (this._nonnegative && parsedValue < 0)
      return { success: false, error: `Number not non-negative` };

    return { success: true, out: parsedValue };
  }

  min(value: number) {
    this._min = value;
    return this;
  }

  max(value: number) {
    this._max = value;
    return this;
  }

  gt(value: number) {
    this._gt = value;
    return this;
  }

  gte(value: number) {
    this._gte = value;
    return this;
  }

  lt(value: number) {
    this._lt = value;
    return this;
  }

  lte(value: number) {
    this._lte = value;
    return this;
  }

  int() {
    this._int = true;
    return this;
  }

  positive() {
    this._positive = true;
    return this;
  }

  nonpositive() {
    this._nonpositive = true;
    return this;
  }

  negative() {
    this._negative = true;
    return this;
  }

  nonnegative() {
    this._nonnegative = true;
    return this;
  }

  safe() {
    this._safe = true;
    return this;
  }

  finite() {
    this._finite = true;
    return this;
  }
}

class ArrayV<TIn, TOut> extends Parser<TIn[], TOut[]> {
  private _min: number | undefined;
  private _max: number | undefined;
  private _length: number | undefined;

  constructor(private parser: InstanceType<typeof Parser<TIn, TOut>>) {
    super();
  }

  parse(value: unknown): Result<TOut[]> {
    if (!Array.isArray(value)) return { success: false, error: "Not array" };
    if (this._length !== undefined && value.length === this._length)
      return { success: false, error: `Array length !== ${this._length}` };
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

  length(len: number) {
    this._length = len;
    return this;
  }
}

type InferObjectVIn<T extends UnknownObjectVParser> =
  MakeUndefinedFieldsOptional<{
    [Key in keyof T]-?: InferIn<T[Key]>;
  }>;
type InferObjectVOut<T extends UnknownObjectVParser> =
  MakeUndefinedFieldsOptional<{
    [Key in keyof T]-?: InferOut<T[Key]>;
  }>;
class ObjectV<T extends UnknownObjectVParser> extends Parser<
  InferObjectVIn<T>,
  InferObjectVOut<T>
> {
  constructor(private shape: T) {
    super();
  }

  parse(value: unknown): Result<InferObjectVOut<T>> {
    const { out, errors } = this.collectErrors(value, "");

    if (errors.length > 0) {
      const errorMessages = errors
        .map(({ key, error }) => `${key}: ${error}`)
        .join(", ");
      return { success: false, error: errorMessages };
    }

    return { success: true, out: out as InferObjectVOut<T> };
  }

  field<Key extends keyof T>(key: Key): T[Key] {
    return this.shape[key];
  }

  private collectErrors(
    value: unknown,
    path: string,
  ): {
    out: InferObjectVOut<T>;
    errors: { key: string; error: string }[];
  } {
    if (typeof value !== "object" || value === null) {
      return {
        out: {} as MakeUndefinedFieldsOptional<{
          [Key in keyof T]-?: InferOut<T[Key]>;
        }>,
        errors: [{ key: path, error: "Not object" }],
      };
    }

    const out = {} as InferObjectVOut<T>;
    const errors: { key: string; error: string }[] = [];

    for (const key in this.shape) {
      const newPath = path ? `${path}.${key}` : key;
      // @ts-ignore
      const res = this.shape[key].parse(value[key]);
      if (!res.success) {
        // @ts-ignore
        errors.push({ key: newPath, error: res.error });
      } else {
        // @ts-ignore
        out[key] = res.out;
      }
    }

    return { out, errors };
  }

  extend<
    TExtensionShape extends UnknownObjectVParser,
    TNewShape = ObjectV<Omit<T, keyof TExtensionShape> & TExtensionShape>,
  >(extensionShape: TExtensionShape): TNewShape {
    const newShape = { ...this.shape } as {
      [Key in keyof (T & TExtensionShape)]: UnknownVParser;
    };

    for (const key in extensionShape) {
      newShape[key] = extensionShape[key];
    }

    return new ObjectV(newShape) as TNewShape;
  }

  pick<TPicked extends keyof T>(picked: { [Key in TPicked]: true }): ObjectV<
    Pick<T, TPicked>
  > {
    const pickedShape = {} as { [Key in TPicked]: T[Key] };
    for (const key in picked) {
      pickedShape[key] = this.shape[key];
    }
    return new ObjectV(pickedShape);
  }

  omit<TOmit extends keyof T>(omit: { [Key in TOmit]: boolean }): ObjectV<
    Omit<T, TOmit>
  > {
    const omitShape = {} as { [Key in keyof T]: T[Key] };
    for (const key in this.shape) {
      // @ts-ignore
      if (omit[key] !== true) {
        omitShape[key] = this.shape[key];
      }
    }
    return new ObjectV(omitShape) as unknown as ObjectV<Omit<T, TOmit>>;
  }

  partial(): ObjectV<{
    [Key in keyof T]: OptionalV<InferIn<T[Key]>, InferOut<T[Key]>>;
  }> {
    const shallowOptional: {
      [Key in keyof T]: OptionalV<InferIn<T[Key]>, InferOut<T[Key]>>;
    } = {} as any;
    for (const key in this.shape) {
      // @ts-ignore
      shallowOptional[key] = new OptionalV(this.shape[key]);
    }
    return new ObjectV(shallowOptional);
  }
}

class UnionV<T extends UnknownVParser> extends Parser<InferIn<T>, InferOut<T>> {
  constructor(private parsers: T[]) {
    super();
  }

  parse(value: unknown): Result<InferOut<T>> {
    for (const parser of this.parsers) {
      const res = parser.parse(value);
      if (res.success) return res as Result<InferOut<T>>;
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
    return { success: true, out: value as T };
  }
}

type TupleVItems = [UnknownVParser, ...UnknownVParser[]];
type AssertArray<T> = T extends unknown[] ? T : never;
type TupleVOut<T extends TupleVItems | []> = AssertArray<{
  [K in keyof T]: T[K] extends UnknownVParser ? InferOut<T[K]> : never;
}>;
type TupleVIn<T extends TupleVItems | []> = AssertArray<{
  [K in keyof T]: T[K] extends UnknownVParser ? InferIn<T[K]> : never;
}>;
class TupleV<T extends TupleVItems> extends Parser<TupleVIn<T>, TupleVOut<T>> {
  private _restParser: UnknownVParser | undefined;

  constructor(private parsers: T) {
    super();
  }

  parse(value: unknown): Result<TupleVOut<T>> {
    if (!Array.isArray(value)) return { success: false, error: `Not array` };
    if (this._restParser === undefined && value.length !== this.parsers.length)
      return { success: false, error: `Not exact length` };

    const out = [];

    for (let i = 0; i < this.parsers.length; ++i) {
      const res = this.parsers[i].parse(value[i]);
      if (!res.success) return { success: false, error: res.error };
      out[i] = res.out;
    }

    if (this._restParser !== undefined) {
      for (let i = this.parsers.length; i < value.length; ++i) {
        const res = this._restParser.parse(value[i]);
        if (!res.success) return { success: false, error: res.error };
        out[i] = res.out;
      }
    }

    return { success: true, out: out as TupleVOut<T> };
  }

  index<Key extends keyof T>(index: Key): T[Key] {
    // @ts-ignore
    if (this._restParser !== undefined && index >= this.parsers.length) {
      // @ts-ignore
      return this._restParser;
    }
    return this.parsers[index];
  }

  rest<TRestParser extends UnknownVParser>(
    restParser: TRestParser,
  ): TupleV<[...T, ...TRestParser[]]> {
    this._restParser = restParser;
    return this as unknown as TupleV<[...T, ...TRestParser[]]>;
  }
}

class RecordV<T extends UnknownVParser> extends Parser<
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
    if (typeof value !== "object")
      return { success: false, error: "Not object" };
    if (Array.isArray(value))
      return { success: false, error: "Array instead of object" };
    if (value === null) return { success: false, error: "Null" };
    const out = {} as { [key: string]: InferOut<T> };

    for (const key in value) {
      // @ts-ignore
      const res = this.parser.parse(value[key]);
      if (!res.success) return res;
      out[key] = res.out as InferOut<T>;
    }

    return { success: true, out };
  }

  value(): T {
    return this.parser;
  }
}

class NullV extends Parser<null, null> {
  constructor() {
    super();
  }

  parse(value: unknown): Result<null> {
    if (value !== null) return { success: false, error: "Not null" };
    return { success: true, out: null };
  }
}

class UnknownV extends Parser<unknown, unknown> {
  constructor() {
    super();
  }

  parse(value: unknown): Result<unknown> {
    return { success: true, out: value };
  }
}

class DiscriminatedUnionV<
  const TDiscriminator extends string,
  TShape extends ObjectV<{ [Key in TDiscriminator]: UnknownVParser }>,
> extends Parser<InferIn<TShape>, InferOut<TShape>> {
  private discriminatorParsers: [UnknownVParser, TShape][];

  constructor(
    private discriminator: TDiscriminator,
    private parsers: TShape[],
  ) {
    super();
    this.discriminatorParsers = this.constructDiscriminatorParsers();
  }

  private constructDiscriminatorParsers(): [UnknownVParser, TShape][] {
    const list: [UnknownVParser, TShape][] = [];

    for (const parser of this.parsers) {
      const discriminatedShape = parser.field(this.discriminator);
      if (discriminatedShape) {
        list.push([discriminatedShape, parser]);
      }
    }

    return list;
  }

  parse(value: unknown): Result<InferOut<TShape>> {
    if (typeof value !== "object")
      return { success: false, error: "Not object" };
    if (value === null) return { success: false, error: "Empty object" };
    if (Array.isArray(value)) return { success: false, error: "Array" };

    // @ts-ignore
    const discriminatorFromValue = value[this.discriminator];
    if (discriminatorFromValue === undefined)
      return {
        success: false,
        error: `Discriminator key '${this.discriminator}' not found`,
      };

    for (const [discriminatorParser, shape] of this.discriminatorParsers) {
      if (discriminatorParser.parse(discriminatorFromValue).success) {
        return shape.parse(value) as Result<InferOut<TShape>>;
      }
    }
    return {
      success: false,
      error: `No parser found for discriminator value: ${discriminatorFromValue}`,
    };
  }
}

export function date() {
  return new DateV();
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
export function nulla() {
  return new NullV();
}
export function unknown() {
  return new UnknownV();
}
export function optional<T>(parser: InstanceType<typeof Parser<T, T>>) {
  return new OptionalV<T, T>(parser);
}
export function nullable<T>(parser: InstanceType<typeof Parser<T, T>>) {
  return new NullableV<T, T>(parser);
}
export function nullish<T>(parser: InstanceType<typeof Parser<T, T>>) {
  return new NullishV<T, T>(parser);
}
export function array<T>(parser: InstanceType<typeof Parser<T, T>>) {
  return new ArrayV<T, T>(parser);
}
export function object<T extends UnknownObjectVParser>(shape: T) {
  return new ObjectV<T>(shape);
}
export function union<T extends UnknownVParser>(parsers: T[]) {
  return new UnionV<T>(parsers);
}
export function discriminatedUnion<
  const TDiscriminator extends string,
  TShape extends ObjectV<{ [Key in TDiscriminator]: UnknownVParser }>,
>(discriminator: TDiscriminator, shape: TShape[]) {
  return new DiscriminatedUnionV<TDiscriminator, TShape>(discriminator, shape);
}
export function literal<
  const T extends string | number | boolean | null | undefined,
>(lit: T) {
  return new LiteralV<T>(lit);
}
export function tuple<T extends TupleVItems>(parsers: T) {
  return new TupleV<T>(parsers);
}
export function record<T extends UnknownVParser>(parser: T) {
  return new RecordV<T>(parser);
}
