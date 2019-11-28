import { letter, anyCharOf, string } from 'parjs';
import { many, between, map, or, qthen } from 'parjs/combinators';

export interface Argument {
  required: boolean;
  variadic: boolean;
  type: 'Argument';
  name: string;
  raw: string;
}

// any-argument-name
const identifier = many()(letter().pipe(or(anyCharOf('-_')))).pipe(
  map(letters => ({
    name: letters.join(''),
    variadic: false,
  }))
);

// ...multiple-arguments
const variadic = string('...')
  .pipe(qthen(identifier))
  .pipe(
    map(arg => ({
      ...arg,
      variadic: true,
    }))
  );

const potentiallyVariadic = variadic.pipe(or(identifier));

// <required-argument>
const requiredArgument = potentiallyVariadic
  .pipe(between('<', '>'))
  .pipe(map(arg => ({ ...arg, required: true })));

// [optional-argument]
const optionalArgument = potentiallyVariadic
  .pipe(between('[', ']'))
  .pipe(map(arg => ({ ...arg, required: false })));

const argument = requiredArgument.pipe(or(optionalArgument));

export const parseArgument = (input: string): Argument => {
  const parsed = argument.parse(input);

  if (!parsed.isOk) {
    throw new SyntaxError(parsed.toString());
  }

  return {
    type: 'Argument',
    variadic: parsed.value.variadic,
    name: parsed.value.name,
    required: parsed.value.required,
    raw: input,
  };
};
