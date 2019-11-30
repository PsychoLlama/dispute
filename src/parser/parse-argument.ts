import P from 'parsimmon';

export interface Argument {
  required: boolean;
  variadic: boolean;
  type: 'Argument';
  name: string;
  raw: string;
}

const parser = P.createLanguage({
  // any-argument-name
  Identifier() {
    return P.alt(P.string('-'), P.string('_'), P.letter)
      .atLeast(1)
      .map(characters => ({
        name: characters.join(''),
        variadic: false,
        required: false,
      }))
      .chain(arg => {
        if (/^_/.test(arg.name))
          return P.fail(`Names can't start with an underscore.`);

        if (/_$/.test(arg.name))
          return P.fail(`Names can't end in an underscore.`);

        if (/^-/.test(arg.name))
          return P.fail(`Names can't start with a hyphen.`);

        if (/-$/.test(arg.name)) return P.fail(`Names can't end in a hyphen.`);

        return P.of(arg);
      });
  },

  // ...multiple-arguments
  Variadic({ Identifier }) {
    return P.seq(P.string('...'), Identifier).map(([, arg]) => ({
      ...arg,
      variadic: true,
    }));
  },

  MaybeVariadic({ Identifier, Variadic }) {
    return P.alt(Variadic, Identifier);
  },

  // <required-argument>
  RequiredArgument({ MaybeVariadic }) {
    return P.seq(P.string('<'), MaybeVariadic, P.string('>')).map(
      ([, arg]) => ({
        ...arg,
        required: true,
      })
    );
  },

  // [optional-argument]
  OptionalArgument({ MaybeVariadic }) {
    return P.seq(P.string('['), MaybeVariadic, P.string(']')).map(
      ([, arg]) => arg
    );
  },

  Argument({ RequiredArgument, OptionalArgument }) {
    return P.alt(RequiredArgument, OptionalArgument);
  },
});

export const parseArgument = (input: string): Argument => {
  const { required, variadic, name } = parser.Argument.tryParse(input);

  return {
    type: 'Argument',
    required,
    variadic,
    name,
    raw: input,
  };
};
