import { Fragment, type ReactNode } from "react";

/**
 * Wraps a list of inline nodes in keyed fragments.
 *
 * Needed for any element array that crosses the server → client boundary as a
 * prop: React's server-component serialiser validates keys on the way through
 * and warns once per unkeyed element. Arrays consumed only by server components
 * can stay plain literals.
 */
export function nodes(...items: ReactNode[]): ReactNode[] {
  return items.map((item, i) => <Fragment key={i}>{item}</Fragment>);
}
