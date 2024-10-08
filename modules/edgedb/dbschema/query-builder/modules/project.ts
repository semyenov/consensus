// GENERATED by @edgedb/generate v0.5.4

import * as $ from "../reflection";
import * as _ from "../imports";
import type * as _default from "./default";
import type * as _finance from "./finance";
import type * as _std from "./std";
import type * as _issue from "./issue";
import type * as _tag from "./tag";
import type * as ___default from "./__default";
export type $MilestoneStatus = {
  "Planned": $.$expr_Literal<$MilestoneStatus>;
  "InProgress": $.$expr_Literal<$MilestoneStatus>;
  "Completed": $.$expr_Literal<$MilestoneStatus>;
  "Overdue": $.$expr_Literal<$MilestoneStatus>;
} & $.EnumType<"project::MilestoneStatus", ["Planned", "InProgress", "Completed", "Overdue"]>;
const MilestoneStatus: $MilestoneStatus = $.makeType<$MilestoneStatus>(_.spec, "024a282d-66b3-11ef-bd16-ddc8dd5edc03", _.syntax.literal);

export type $ProjectStatus = {
  "Active": $.$expr_Literal<$ProjectStatus>;
  "Archived": $.$expr_Literal<$ProjectStatus>;
  "Completed": $.$expr_Literal<$ProjectStatus>;
} & $.EnumType<"project::ProjectStatus", ["Active", "Archived", "Completed"]>;
const ProjectStatus: $ProjectStatus = $.makeType<$ProjectStatus>(_.spec, "0275a6e3-66b3-11ef-bb11-8798b24ba42f", _.syntax.literal);

export type $MilestoneλShape = $.typeutil.flatten<_default.$BaseObjectλShape & _default.$AuditableλShape & {
  "budget": $.LinkDesc<_finance.$Budget, $.Cardinality.One, {}, false, false,  false, false>;
  "due_date": $.PropertyDesc<_std.$datetime, $.Cardinality.One, false, false, false, false>;
  "issues": $.LinkDesc<_issue.$Issue, $.Cardinality.Many, {}, false, false,  false, false>;
  "start_date": $.PropertyDesc<_std.$datetime, $.Cardinality.One, false, false, false, false>;
  "status": $.PropertyDesc<$MilestoneStatus, $.Cardinality.One, false, false, false, true>;
  "project": $.LinkDesc<$Project, $.Cardinality.One, {}, false, false,  false, false>;
  "completion_percentage": $.PropertyDesc<_std.$float64, $.Cardinality.One, false, true, false, false>;
  "<milestone[is issue::Issue]": $.LinkDesc<_issue.$Issue, $.Cardinality.Many, {}, false, false,  false, false>;
  "<milestone": $.LinkDesc<$.ObjectType, $.Cardinality.Many, {}, false, false,  false, false>;
}>;
type $Milestone = $.ObjectType<"project::Milestone", $MilestoneλShape, null, [
  ..._default.$BaseObject['__exclusives__'],
  ..._default.$Auditable['__exclusives__'],
]>;
const $Milestone = $.makeType<$Milestone>(_.spec, "024a38da-66b3-11ef-96ba-377694305db0", _.syntax.literal);

const Milestone: $.$expr_PathNode<$.TypeSet<$Milestone, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Milestone, $.Cardinality.Many), null);

export type $ProjectλShape = $.typeutil.flatten<_default.$BaseObjectλShape & _default.$AuditableλShape & _tag.$TaggableλShape & {
  "budget": $.LinkDesc<_finance.$Budget, $.Cardinality.One, {}, false, false,  false, false>;
  "issues": $.LinkDesc<_issue.$Issue, $.Cardinality.Many, {}, false, false,  false, false>;
  "owner": $.LinkDesc<_default.$User, $.Cardinality.One, {}, true, false,  false, true>;
  "actual_completion_date": $.PropertyDesc<_std.$datetime, $.Cardinality.AtMostOne, false, false, false, false>;
  "estimated_completion_date": $.PropertyDesc<_std.$datetime, $.Cardinality.AtMostOne, false, false, false, false>;
  "status": $.PropertyDesc<$ProjectStatus, $.Cardinality.One, false, false, false, true>;
  "open_issues": $.PropertyDesc<_std.$int64, $.Cardinality.One, false, true, false, false>;
  "progress_percentage": $.PropertyDesc<_std.$decimal, $.Cardinality.One, false, true, false, false>;
  "total_issues": $.PropertyDesc<_std.$int64, $.Cardinality.One, false, true, false, false>;
  "teams": $.LinkDesc<$Team, $.Cardinality.Many, {}, false, false,  false, false>;
  "<project[is project::Milestone]": $.LinkDesc<$Milestone, $.Cardinality.Many, {}, false, false,  false, false>;
  "<projects[is project::Team]": $.LinkDesc<$Team, $.Cardinality.Many, {}, false, false,  false, false>;
  "<project[is project::Sprint]": $.LinkDesc<$Sprint, $.Cardinality.Many, {}, false, false,  false, false>;
  "<projects[is User]": $.LinkDesc<_default.$User, $.Cardinality.Many, {}, false, false,  false, false>;
  "<projects[is __default::current_user]": $.LinkDesc<___default.$current_user, $.Cardinality.Many, {}, false, false,  false, false>;
  "<projects[is current_user]": $.LinkDesc<_default.$current_user, $.Cardinality.Many, {}, false, false,  false, false>;
  "<project[is finance::Budget]": $.LinkDesc<_finance.$Budget, $.Cardinality.Many, {}, false, false,  false, false>;
  "<project": $.LinkDesc<$.ObjectType, $.Cardinality.Many, {}, false, false,  false, false>;
  "<projects": $.LinkDesc<$.ObjectType, $.Cardinality.Many, {}, false, false,  false, false>;
}>;
type $Project = $.ObjectType<"project::Project", $ProjectλShape, null, [
  ..._default.$BaseObject['__exclusives__'],
  ..._default.$Auditable['__exclusives__'],
  ..._tag.$Taggable['__exclusives__'],
  {owner: {__element__: _default.$User, __cardinality__: $.Cardinality.One | $.Cardinality.AtMostOne },},
]>;
const $Project = $.makeType<$Project>(_.spec, "0275b382-66b3-11ef-b6ba-39d179c37d38", _.syntax.literal);

const Project: $.$expr_PathNode<$.TypeSet<$Project, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Project, $.Cardinality.Many), null);

export type $SprintλShape = $.typeutil.flatten<_default.$AuditableλShape & _default.$BaseObjectλShape & {
  "issues": $.LinkDesc<_issue.$Issue, $.Cardinality.Many, {}, false, false,  false, false>;
  "completed_story_points": $.PropertyDesc<_std.$int64, $.Cardinality.One, false, true, false, false>;
  "total_story_points": $.PropertyDesc<_std.$int64, $.Cardinality.One, false, true, false, false>;
  "completion_percentage": $.PropertyDesc<_std.$float64, $.Cardinality.One, false, true, false, false>;
  "project": $.LinkDesc<$Project, $.Cardinality.One, {}, false, false,  false, false>;
  "end_date": $.PropertyDesc<_std.$datetime, $.Cardinality.One, false, false, false, false>;
  "start_date": $.PropertyDesc<_std.$datetime, $.Cardinality.One, false, false, false, false>;
}>;
type $Sprint = $.ObjectType<"project::Sprint", $SprintλShape, null, [
  ..._default.$Auditable['__exclusives__'],
  ..._default.$BaseObject['__exclusives__'],
]>;
const $Sprint = $.makeType<$Sprint>(_.spec, "03a4965b-66b3-11ef-9c7a-0df4d8026541", _.syntax.literal);

const Sprint: $.$expr_PathNode<$.TypeSet<$Sprint, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Sprint, $.Cardinality.Many), null);

export type $TeamλShape = $.typeutil.flatten<_default.$BaseObjectλShape & {
  "owner": $.LinkDesc<_default.$User, $.Cardinality.One, {}, false, false,  false, false>;
  "members": $.LinkDesc<_default.$User, $.Cardinality.Many, {}, false, false,  false, false>;
  "team_size": $.PropertyDesc<_std.$int64, $.Cardinality.One, false, true, false, false>;
  "projects": $.LinkDesc<$Project, $.Cardinality.Many, {}, false, false,  false, false>;
  "<teams[is project::Project]": $.LinkDesc<$Project, $.Cardinality.Many, {}, false, false,  false, false>;
  "<teams[is User]": $.LinkDesc<_default.$User, $.Cardinality.Many, {}, false, false,  false, false>;
  "<teams[is __default::current_user]": $.LinkDesc<___default.$current_user, $.Cardinality.Many, {}, false, false,  false, false>;
  "<teams[is current_user]": $.LinkDesc<_default.$current_user, $.Cardinality.Many, {}, false, false,  false, false>;
  "<teams": $.LinkDesc<$.ObjectType, $.Cardinality.Many, {}, false, false,  false, false>;
}>;
type $Team = $.ObjectType<"project::Team", $TeamλShape, null, [
  ..._default.$BaseObject['__exclusives__'],
]>;
const $Team = $.makeType<$Team>(_.spec, "038edc95-66b3-11ef-b628-e51912fba94a", _.syntax.literal);

const Team: $.$expr_PathNode<$.TypeSet<$Team, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Team, $.Cardinality.Many), null);

type calculate_project_healthλFuncExpr<
  P1 extends $.TypeSet<$Project>,
> = $.$expr_Function<
  _std.$decimal, $.cardutil.paramCardinality<P1>
>;
function calculate_project_health<
  P1 extends $.TypeSet<$Project>,
>(
  project: P1,
): calculate_project_healthλFuncExpr<P1>;
function calculate_project_health(...args: any[]) {
  const {returnType, cardinality, args: positionalArgs, namedArgs} = _.syntax.$resolveOverload('project::calculate_project_health', args, _.spec, [
    {args: [{typeId: "0275b382-66b3-11ef-b6ba-39d179c37d38", optional: false, setoftype: false, variadic: false}], returnTypeId: "00000000-0000-0000-0000-000000000108"},
  ]);
  return _.syntax.$expressionify({
    __kind__: $.ExpressionKind.Function,
    __element__: returnType,
    __cardinality__: cardinality,
    __name__: "project::calculate_project_health",
    __args__: positionalArgs,
    __namedargs__: namedArgs,
  }) as any;
};



export { MilestoneStatus, ProjectStatus, $Milestone, Milestone, $Project, Project, $Sprint, Sprint, $Team, Team };

type __defaultExports = {
  "MilestoneStatus": typeof MilestoneStatus;
  "ProjectStatus": typeof ProjectStatus;
  "Milestone": typeof Milestone;
  "Project": typeof Project;
  "Sprint": typeof Sprint;
  "Team": typeof Team;
  "calculate_project_health": typeof calculate_project_health
};
const __defaultExports: __defaultExports = {
  "MilestoneStatus": MilestoneStatus,
  "ProjectStatus": ProjectStatus,
  "Milestone": Milestone,
  "Project": Project,
  "Sprint": Sprint,
  "Team": Team,
  "calculate_project_health": calculate_project_health
};
export default __defaultExports;
