declare module 'minimalistic-assert' {
  function assert<T>(value: T, message?: string): undefined;

  namespace assert {
    function equal<Type1, Type2>(
      a: Type1,
      b: Type2,
      message?: string
    ): undefined;
  }

  export = assert;
}
