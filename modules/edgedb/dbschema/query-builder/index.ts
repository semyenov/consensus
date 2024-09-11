// GENERATED by @edgedb/generate v0.5.4

export * from "./external";
export { createClient } from "edgedb";
import * as $ from "./reflection";
import * as $syntax from "./syntax";
import * as $op from "./operators";
import _std from "./modules/std";
import _cal from "./modules/cal";
import _cfg from "./modules/cfg";
import _ext from "./modules/ext";
import _finance from "./modules/finance";
import _fts from "./modules/fts";
import _issue from "./modules/issue";
import _project from "./modules/project";
import _schema from "./modules/schema";
import _search from "./modules/search";
import _sys from "./modules/sys";
import _default from "./modules/default";
import __default_16 from "./modules/__default";
import _tag from "./modules/tag";
import _math from "./modules/math";

const ExportDefault: Omit<typeof _std, "BaseObject"> & 
  typeof _default & 
  $.util.OmitDollarPrefixed<typeof $syntax> & 
  typeof $op & {
  "std": typeof _std;
  "cal": typeof _cal;
  "cfg": typeof _cfg;
  "ext": typeof _ext;
  "finance": typeof _finance;
  "fts": typeof _fts;
  "issue": typeof _issue;
  "project": typeof _project;
  "schema": typeof _schema;
  "search": typeof _search;
  "sys": typeof _sys;
  "default": typeof _default;
  "__default": typeof __default_16;
  "tag": typeof _tag;
  "math": typeof _math;
} = {
  ..._std,
  ..._default,
  ...$.util.omitDollarPrefixed($syntax),
  ...$op,
  "std": _std,
  "cal": _cal,
  "cfg": _cfg,
  "ext": _ext,
  "finance": _finance,
  "fts": _fts,
  "issue": _issue,
  "project": _project,
  "schema": _schema,
  "search": _search,
  "sys": _sys,
  "default": _default,
  "__default": __default_16,
  "tag": _tag,
  "math": _math,
};
const Cardinality = $.Cardinality;
type Cardinality = $.Cardinality;
export type Set<
  Type extends $.BaseType,
  Card extends $.Cardinality = $.Cardinality.Many
> = $.TypeSet<Type, Card>;


export default ExportDefault;
export { Cardinality };