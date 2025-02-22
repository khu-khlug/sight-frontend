export type PropsOf<T extends React.ComponentType<any>> =
  T extends React.ComponentType<infer P> ? P : never;
