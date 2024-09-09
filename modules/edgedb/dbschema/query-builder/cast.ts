// GENERATED by @edgedb/generate v0.5.4

import { ExpressionKind, Cardinality } from "edgedb/dist/reflection/index";
import type {
  Expression,
  BaseType,
  TypeSet,
  ObjectTypeExpression,
  ScalarType,
} from "./typesystem";
import { $expressionify } from "./path";
import type { orScalarLiteral } from "./castMaps";
import { literalToTypeSet } from "./castMaps";

export function cast<Target extends BaseType | ObjectTypeExpression>(
  target: Target,
  arg: null,
): $expr_Cast<
  Target extends BaseType
    ? Target
    : Target extends ObjectTypeExpression
      ? Target["__element__"]
      : never,
  Cardinality.Empty
>;
export function cast<
  Target extends ObjectTypeExpression,
  Card extends Cardinality,
>(
  target: Target,
  arg: TypeSet<ScalarType<"std::uuid">, Card>,
): $expr_Cast<Target["__element__"], Card>;
export function cast<Target extends BaseType, Expr extends TypeSet>(
  target: Target,
  expr: orScalarLiteral<Expr>,
): $expr_Cast<
  Target,
  Cardinality extends Expr["__cardinality__"]
    ? Cardinality.One
    : Expr["__cardinality__"]
>;
export function cast(target: BaseType, expr: any) {
  const cleanedExpr = expr === null ? null : literalToTypeSet(expr);
  return $expressionify({
    __element__: (target as any).__cardinality__
      ? (target as any).__element__
      : target,
    __cardinality__:
      cleanedExpr === null ? Cardinality.Empty : cleanedExpr.__cardinality__,
    __expr__: cleanedExpr,
    __kind__: ExpressionKind.Cast,
  }) as any;
}

export type $expr_Cast<
  Target extends BaseType = BaseType,
  Card extends Cardinality = Cardinality,
> = Expression<{
  __element__: Target;
  __cardinality__: Card;
  __kind__: ExpressionKind.Cast;
  __expr__: TypeSet | null;
}>;
