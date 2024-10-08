// GENERATED by @edgedb/generate v0.5.4

import * as $ from "../reflection";
import * as _ from "../imports";
import type * as _std from "./std";
import type * as _default from "./default";
import type * as _project from "./project";
import type * as _issue from "./issue";
export type $PaymentStatus = {
  "Pending": $.$expr_Literal<$PaymentStatus>;
  "Approved": $.$expr_Literal<$PaymentStatus>;
  "Rejected": $.$expr_Literal<$PaymentStatus>;
  "Paid": $.$expr_Literal<$PaymentStatus>;
} & $.EnumType<"finance::PaymentStatus", ["Pending", "Approved", "Rejected", "Paid"]>;
const PaymentStatus: $PaymentStatus = $.makeType<$PaymentStatus>(_.spec, "03168ac5-66b3-11ef-b6be-b9945b002ef5", _.syntax.literal);

export type $MonetaryλShape = $.typeutil.flatten<_std.$Object_8ce8c71ee4fa5f73840c22d7eaa58588λShape & {
  "amount": $.PropertyDesc<_std.$decimal, $.Cardinality.One, false, false, false, false>;
}>;
type $Monetary = $.ObjectType<"finance::Monetary", $MonetaryλShape, null, [
  ..._std.$Object_8ce8c71ee4fa5f73840c22d7eaa58588['__exclusives__'],
]>;
const $Monetary = $.makeType<$Monetary>(_.spec, "01e33dd7-66b3-11ef-a8dd-db4651cf7396", _.syntax.literal);

const Monetary: $.$expr_PathNode<$.TypeSet<$Monetary, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Monetary, $.Cardinality.Many), null);

export type $BudgetλShape = $.typeutil.flatten<_default.$BaseObjectλShape & _default.$AuditableλShape & $MonetaryλShape & {
  "owner": $.LinkDesc<_default.$User, $.Cardinality.One, {}, false, false,  false, false>;
  "total_amount": $.PropertyDesc<_std.$decimal, $.Cardinality.One, false, false, false, false>;
  "remaining_balance": $.PropertyDesc<_std.$decimal, $.Cardinality.One, false, false, false, true>;
  "spent_amount": $.PropertyDesc<_std.$decimal, $.Cardinality.One, false, true, false, false>;
  "project": $.LinkDesc<_project.$Project, $.Cardinality.One, {}, false, false,  false, false>;
  "<budget[is project::Milestone]": $.LinkDesc<_project.$Milestone, $.Cardinality.Many, {}, false, false,  false, false>;
  "<budget[is project::Project]": $.LinkDesc<_project.$Project, $.Cardinality.Many, {}, false, false,  false, false>;
  "<budget[is finance::Expense]": $.LinkDesc<$Expense, $.Cardinality.Many, {}, false, false,  false, false>;
  "<budget": $.LinkDesc<$.ObjectType, $.Cardinality.Many, {}, false, false,  false, false>;
}>;
type $Budget = $.ObjectType<"finance::Budget", $BudgetλShape, null, [
  ..._default.$BaseObject['__exclusives__'],
  ..._default.$Auditable['__exclusives__'],
  ...$Monetary['__exclusives__'],
]>;
const $Budget = $.makeType<$Budget>(_.spec, "01e572bd-66b3-11ef-9cc3-d5b4d0c1a143", _.syntax.literal);

const Budget: $.$expr_PathNode<$.TypeSet<$Budget, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Budget, $.Cardinality.Many), null);

export type $ExpenseλShape = $.typeutil.flatten<_default.$BaseObjectλShape & _default.$AuditableλShape & $MonetaryλShape & {
  "created_by": $.LinkDesc<_default.$User, $.Cardinality.One, {}, false, false,  false, false>;
  "budget": $.LinkDesc<$Budget, $.Cardinality.One, {}, false, false,  false, false>;
}>;
type $Expense = $.ObjectType<"finance::Expense", $ExpenseλShape, null, [
  ..._default.$BaseObject['__exclusives__'],
  ..._default.$Auditable['__exclusives__'],
  ...$Monetary['__exclusives__'],
]>;
const $Expense = $.makeType<$Expense>(_.spec, "02fe86c0-66b3-11ef-9025-5bc6f6a12fd1", _.syntax.literal);

const Expense: $.$expr_PathNode<$.TypeSet<$Expense, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Expense, $.Cardinality.Many), null);

export type $PaymentλShape = $.typeutil.flatten<_default.$BaseObjectλShape & _default.$AuditableλShape & $MonetaryλShape & {
  "approved_by": $.LinkDesc<_default.$User, $.Cardinality.One, {}, false, false,  false, false>;
  "recipient": $.LinkDesc<_default.$User, $.Cardinality.One, {}, false, false,  false, false>;
  "associated_issue": $.LinkDesc<_issue.$Issue, $.Cardinality.One, {}, false, false,  false, false>;
  "status": $.PropertyDesc<$PaymentStatus, $.Cardinality.One, false, false, false, true>;
}>;
type $Payment = $.ObjectType<"finance::Payment", $PaymentλShape, null, [
  ..._default.$BaseObject['__exclusives__'],
  ..._default.$Auditable['__exclusives__'],
  ...$Monetary['__exclusives__'],
]>;
const $Payment = $.makeType<$Payment>(_.spec, "03169df5-66b3-11ef-b579-1905cb4f70cc", _.syntax.literal);

const Payment: $.$expr_PathNode<$.TypeSet<$Payment, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Payment, $.Cardinality.Many), null);



export { PaymentStatus, $Monetary, Monetary, $Budget, Budget, $Expense, Expense, $Payment, Payment };

type __defaultExports = {
  "PaymentStatus": typeof PaymentStatus;
  "Monetary": typeof Monetary;
  "Budget": typeof Budget;
  "Expense": typeof Expense;
  "Payment": typeof Payment
};
const __defaultExports: __defaultExports = {
  "PaymentStatus": PaymentStatus,
  "Monetary": Monetary,
  "Budget": Budget,
  "Expense": Expense,
  "Payment": Payment
};
export default __defaultExports;
