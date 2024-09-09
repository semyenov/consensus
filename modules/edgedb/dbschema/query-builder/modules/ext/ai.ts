// GENERATED by @edgedb/generate v0.5.4

import * as $ from "../../reflection";
import * as _ from "../../imports";
import type * as _std from "../std";
import type * as _cfg from "../cfg";
export type $ChatParticipantRole = {
  "System": $.$expr_Literal<$ChatParticipantRole>;
  "User": $.$expr_Literal<$ChatParticipantRole>;
  "Assistant": $.$expr_Literal<$ChatParticipantRole>;
  "Tool": $.$expr_Literal<$ChatParticipantRole>;
} & $.EnumType<"ext::ai::ChatParticipantRole", ["System", "User", "Assistant", "Tool"]>;
const ChatParticipantRole: $ChatParticipantRole = $.makeType<$ChatParticipantRole>(_.spec, "c4cba163-2bdd-561e-ba4e-8c9f79787f06", _.syntax.literal);

export type $DistanceFunction = {
  "Cosine": $.$expr_Literal<$DistanceFunction>;
  "InnerProduct": $.$expr_Literal<$DistanceFunction>;
  "L2": $.$expr_Literal<$DistanceFunction>;
} & $.EnumType<"ext::ai::DistanceFunction", ["Cosine", "InnerProduct", "L2"]>;
const DistanceFunction: $DistanceFunction = $.makeType<$DistanceFunction>(_.spec, "f8fd0d08-af80-52ed-a47e-17b2a546665e", _.syntax.literal);

export type $IndexType = {
  "HNSW": $.$expr_Literal<$IndexType>;
} & $.EnumType<"ext::ai::IndexType", ["HNSW"]>;
const IndexType: $IndexType = $.makeType<$IndexType>(_.spec, "10d78b63-7cec-5d40-905f-80fa0fb82c92", _.syntax.literal);

export type $ProviderAPIStyle = {
  "OpenAI": $.$expr_Literal<$ProviderAPIStyle>;
  "Anthropic": $.$expr_Literal<$ProviderAPIStyle>;
} & $.EnumType<"ext::ai::ProviderAPIStyle", ["OpenAI", "Anthropic"]>;
const ProviderAPIStyle: $ProviderAPIStyle = $.makeType<$ProviderAPIStyle>(_.spec, "fb68201d-f255-5e54-9eda-90118467d590", _.syntax.literal);

export type $ModelλShape = $.typeutil.flatten<_std.$Object_8ce8c71ee4fa5f73840c22d7eaa58588λShape & {
}>;
type $Model = $.ObjectType<"ext::ai::Model", $ModelλShape, null, [
  ..._std.$Object_8ce8c71ee4fa5f73840c22d7eaa58588['__exclusives__'],
]>;
const $Model = $.makeType<$Model>(_.spec, "565f7280-623a-5d7e-b4fb-71bf96177af3", _.syntax.literal);

const Model: $.$expr_PathNode<$.TypeSet<$Model, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Model, $.Cardinality.Many), null);

export type $TextGenerationModelλShape = $.typeutil.flatten<$ModelλShape & {
}>;
type $TextGenerationModel = $.ObjectType<"ext::ai::TextGenerationModel", $TextGenerationModelλShape, null, [
  ...$Model['__exclusives__'],
]>;
const $TextGenerationModel = $.makeType<$TextGenerationModel>(_.spec, "f02bc693-ba4b-5441-a9be-c9ed21e22d8c", _.syntax.literal);

const TextGenerationModel: $.$expr_PathNode<$.TypeSet<$TextGenerationModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($TextGenerationModel, $.Cardinality.Many), null);

export type $AnthropicClaude3HaikuModelλShape = $.typeutil.flatten<$TextGenerationModelλShape & {
}>;
type $AnthropicClaude3HaikuModel = $.ObjectType<"ext::ai::AnthropicClaude3HaikuModel", $AnthropicClaude3HaikuModelλShape, null, [
  ...$TextGenerationModel['__exclusives__'],
]>;
const $AnthropicClaude3HaikuModel = $.makeType<$AnthropicClaude3HaikuModel>(_.spec, "b2a014c5-4f47-55dd-a5a0-2d5e32f1c140", _.syntax.literal);

const AnthropicClaude3HaikuModel: $.$expr_PathNode<$.TypeSet<$AnthropicClaude3HaikuModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($AnthropicClaude3HaikuModel, $.Cardinality.Many), null);

export type $AnthropicClaude3OpusModelλShape = $.typeutil.flatten<$TextGenerationModelλShape & {
}>;
type $AnthropicClaude3OpusModel = $.ObjectType<"ext::ai::AnthropicClaude3OpusModel", $AnthropicClaude3OpusModelλShape, null, [
  ...$TextGenerationModel['__exclusives__'],
]>;
const $AnthropicClaude3OpusModel = $.makeType<$AnthropicClaude3OpusModel>(_.spec, "226ebca6-7196-557b-819f-5180fc5467c0", _.syntax.literal);

const AnthropicClaude3OpusModel: $.$expr_PathNode<$.TypeSet<$AnthropicClaude3OpusModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($AnthropicClaude3OpusModel, $.Cardinality.Many), null);

export type $AnthropicClaude3SonnetModelλShape = $.typeutil.flatten<$TextGenerationModelλShape & {
}>;
type $AnthropicClaude3SonnetModel = $.ObjectType<"ext::ai::AnthropicClaude3SonnetModel", $AnthropicClaude3SonnetModelλShape, null, [
  ...$TextGenerationModel['__exclusives__'],
]>;
const $AnthropicClaude3SonnetModel = $.makeType<$AnthropicClaude3SonnetModel>(_.spec, "4622657a-238a-58eb-95e8-2d8352c278d8", _.syntax.literal);

const AnthropicClaude3SonnetModel: $.$expr_PathNode<$.TypeSet<$AnthropicClaude3SonnetModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($AnthropicClaude3SonnetModel, $.Cardinality.Many), null);

export type $ProviderConfigλShape = $.typeutil.flatten<_cfg.$ConfigObjectλShape & {
  "name": $.PropertyDesc<_std.$str, $.Cardinality.One, true, false, true, false>;
  "display_name": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, false>;
  "api_url": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, false>;
  "client_id": $.PropertyDesc<_std.$str, $.Cardinality.AtMostOne, false, false, true, false>;
  "secret": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, false>;
  "api_style": $.PropertyDesc<$ProviderAPIStyle, $.Cardinality.One, false, false, false, false>;
  "<providers[is ext::ai::Config]": $.LinkDesc<$Config, $.Cardinality.Many, {}, false, false,  false, false>;
  "<providers": $.LinkDesc<$.ObjectType, $.Cardinality.Many, {}, false, false,  false, false>;
}>;
type $ProviderConfig = $.ObjectType<"ext::ai::ProviderConfig", $ProviderConfigλShape, null, [
  ..._cfg.$ConfigObject['__exclusives__'],
  {name: {__element__: _std.$str, __cardinality__: $.Cardinality.One | $.Cardinality.AtMostOne },},
]>;
const $ProviderConfig = $.makeType<$ProviderConfig>(_.spec, "b3da3af2-6dc0-5e6d-94fe-9e9d95bb6ada", _.syntax.literal);

const ProviderConfig: $.$expr_PathNode<$.TypeSet<$ProviderConfig, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($ProviderConfig, $.Cardinality.Many), null);

export type $AnthropicProviderConfigλShape = $.typeutil.flatten<Omit<$ProviderConfigλShape, "name" | "display_name" | "api_url" | "api_style"> & {
  "name": $.PropertyDesc<_std.$str, $.Cardinality.One, true, false, true, true>;
  "display_name": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, true>;
  "api_url": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, true>;
  "api_style": $.PropertyDesc<$ProviderAPIStyle, $.Cardinality.One, false, false, false, true>;
}>;
type $AnthropicProviderConfig = $.ObjectType<"ext::ai::AnthropicProviderConfig", $AnthropicProviderConfigλShape, null, [
  ...$ProviderConfig['__exclusives__'],
  {name: {__element__: _std.$str, __cardinality__: $.Cardinality.One | $.Cardinality.AtMostOne },},
]>;
const $AnthropicProviderConfig = $.makeType<$AnthropicProviderConfig>(_.spec, "966941a0-b74f-578f-a448-469387bed8f7", _.syntax.literal);

const AnthropicProviderConfig: $.$expr_PathNode<$.TypeSet<$AnthropicProviderConfig, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($AnthropicProviderConfig, $.Cardinality.Many), null);

export type $ChatPromptλShape = $.typeutil.flatten<_std.$Object_8ce8c71ee4fa5f73840c22d7eaa58588λShape & {
  "name": $.PropertyDesc<_std.$str, $.Cardinality.One, true, false, false, false>;
  "messages": $.LinkDesc<$ChatPromptMessage, $.Cardinality.AtLeastOne, {}, true, false,  false, false>;
}>;
type $ChatPrompt = $.ObjectType<"ext::ai::ChatPrompt", $ChatPromptλShape, null, [
  ..._std.$Object_8ce8c71ee4fa5f73840c22d7eaa58588['__exclusives__'],
  {messages: {__element__: $ChatPromptMessage, __cardinality__: $.Cardinality.One | $.Cardinality.AtMostOne },},
  {name: {__element__: _std.$str, __cardinality__: $.Cardinality.One | $.Cardinality.AtMostOne },},
]>;
const $ChatPrompt = $.makeType<$ChatPrompt>(_.spec, "e5cc9c09-da53-53f0-905a-4eb5eb74fb62", _.syntax.literal);

const ChatPrompt: $.$expr_PathNode<$.TypeSet<$ChatPrompt, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($ChatPrompt, $.Cardinality.Many), null);

export type $ChatPromptMessageλShape = $.typeutil.flatten<_std.$Object_8ce8c71ee4fa5f73840c22d7eaa58588λShape & {
  "participant_role": $.PropertyDesc<$ChatParticipantRole, $.Cardinality.One, false, false, false, false>;
  "participant_name": $.PropertyDesc<_std.$str, $.Cardinality.AtMostOne, false, false, false, false>;
  "content": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, false, false>;
  "<messages[is ext::ai::ChatPrompt]": $.LinkDesc<$ChatPrompt, $.Cardinality.AtMostOne, {}, false, false,  false, false>;
  "<messages": $.LinkDesc<$.ObjectType, $.Cardinality.Many, {}, false, false,  false, false>;
}>;
type $ChatPromptMessage = $.ObjectType<"ext::ai::ChatPromptMessage", $ChatPromptMessageλShape, null, [
  ..._std.$Object_8ce8c71ee4fa5f73840c22d7eaa58588['__exclusives__'],
]>;
const $ChatPromptMessage = $.makeType<$ChatPromptMessage>(_.spec, "66bb9784-2d30-5686-b4b6-1d1e86e4405c", _.syntax.literal);

const ChatPromptMessage: $.$expr_PathNode<$.TypeSet<$ChatPromptMessage, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($ChatPromptMessage, $.Cardinality.Many), null);

export type $ConfigλShape = $.typeutil.flatten<_cfg.$ExtensionConfigλShape & {
  "indexer_naptime": $.PropertyDesc<_std.$duration, $.Cardinality.One, false, false, false, true>;
  "providers": $.LinkDesc<$ProviderConfig, $.Cardinality.Many, {}, false, false,  false, false>;
}>;
type $Config = $.ObjectType<"ext::ai::Config", $ConfigλShape, null, [
  ..._cfg.$ExtensionConfig['__exclusives__'],
]>;
const $Config = $.makeType<$Config>(_.spec, "ed18b571-eb08-5592-bf88-ae9387228948", _.syntax.literal);

const Config: $.$expr_PathNode<$.TypeSet<$Config, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($Config, $.Cardinality.Many), null);

export type $CustomProviderConfigλShape = $.typeutil.flatten<Omit<$ProviderConfigλShape, "display_name" | "api_style"> & {
  "display_name": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, true>;
  "api_style": $.PropertyDesc<$ProviderAPIStyle, $.Cardinality.One, false, false, false, true>;
}>;
type $CustomProviderConfig = $.ObjectType<"ext::ai::CustomProviderConfig", $CustomProviderConfigλShape, null, [
  ...$ProviderConfig['__exclusives__'],
]>;
const $CustomProviderConfig = $.makeType<$CustomProviderConfig>(_.spec, "ed6a0713-b801-5698-b140-577d010caf51", _.syntax.literal);

const CustomProviderConfig: $.$expr_PathNode<$.TypeSet<$CustomProviderConfig, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($CustomProviderConfig, $.Cardinality.Many), null);

export type $EmbeddingModelλShape = $.typeutil.flatten<$ModelλShape & {
}>;
type $EmbeddingModel = $.ObjectType<"ext::ai::EmbeddingModel", $EmbeddingModelλShape, null, [
  ...$Model['__exclusives__'],
]>;
const $EmbeddingModel = $.makeType<$EmbeddingModel>(_.spec, "2be00162-862e-5ed0-98aa-3fd5d838117b", _.syntax.literal);

const EmbeddingModel: $.$expr_PathNode<$.TypeSet<$EmbeddingModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($EmbeddingModel, $.Cardinality.Many), null);

export type $MistralEmbedModelλShape = $.typeutil.flatten<$EmbeddingModelλShape & {
}>;
type $MistralEmbedModel = $.ObjectType<"ext::ai::MistralEmbedModel", $MistralEmbedModelλShape, null, [
  ...$EmbeddingModel['__exclusives__'],
]>;
const $MistralEmbedModel = $.makeType<$MistralEmbedModel>(_.spec, "c9e561a3-cf66-5393-8a28-a0488934fa59", _.syntax.literal);

const MistralEmbedModel: $.$expr_PathNode<$.TypeSet<$MistralEmbedModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($MistralEmbedModel, $.Cardinality.Many), null);

export type $MistralLargeModelλShape = $.typeutil.flatten<$TextGenerationModelλShape & {
}>;
type $MistralLargeModel = $.ObjectType<"ext::ai::MistralLargeModel", $MistralLargeModelλShape, null, [
  ...$TextGenerationModel['__exclusives__'],
]>;
const $MistralLargeModel = $.makeType<$MistralLargeModel>(_.spec, "6fb66072-f65b-58bb-a1ae-c97150372321", _.syntax.literal);

const MistralLargeModel: $.$expr_PathNode<$.TypeSet<$MistralLargeModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($MistralLargeModel, $.Cardinality.Many), null);

export type $MistralMediumModelλShape = $.typeutil.flatten<$TextGenerationModelλShape & {
}>;
type $MistralMediumModel = $.ObjectType<"ext::ai::MistralMediumModel", $MistralMediumModelλShape, null, [
  ...$TextGenerationModel['__exclusives__'],
]>;
const $MistralMediumModel = $.makeType<$MistralMediumModel>(_.spec, "2e0d7995-3406-5200-9bec-066defa8b5e9", _.syntax.literal);

const MistralMediumModel: $.$expr_PathNode<$.TypeSet<$MistralMediumModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($MistralMediumModel, $.Cardinality.Many), null);

export type $MistralProviderConfigλShape = $.typeutil.flatten<Omit<$ProviderConfigλShape, "name" | "display_name" | "api_url" | "api_style"> & {
  "name": $.PropertyDesc<_std.$str, $.Cardinality.One, true, false, true, true>;
  "display_name": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, true>;
  "api_url": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, true>;
  "api_style": $.PropertyDesc<$ProviderAPIStyle, $.Cardinality.One, false, false, false, true>;
}>;
type $MistralProviderConfig = $.ObjectType<"ext::ai::MistralProviderConfig", $MistralProviderConfigλShape, null, [
  ...$ProviderConfig['__exclusives__'],
  {name: {__element__: _std.$str, __cardinality__: $.Cardinality.One | $.Cardinality.AtMostOne },},
]>;
const $MistralProviderConfig = $.makeType<$MistralProviderConfig>(_.spec, "df20a776-d6bb-586c-b3a7-9b8efe33c10b", _.syntax.literal);

const MistralProviderConfig: $.$expr_PathNode<$.TypeSet<$MistralProviderConfig, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($MistralProviderConfig, $.Cardinality.Many), null);

export type $MistralSmallModelλShape = $.typeutil.flatten<$TextGenerationModelλShape & {
}>;
type $MistralSmallModel = $.ObjectType<"ext::ai::MistralSmallModel", $MistralSmallModelλShape, null, [
  ...$TextGenerationModel['__exclusives__'],
]>;
const $MistralSmallModel = $.makeType<$MistralSmallModel>(_.spec, "b990f170-257c-5c25-8344-c193406c4a29", _.syntax.literal);

const MistralSmallModel: $.$expr_PathNode<$.TypeSet<$MistralSmallModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($MistralSmallModel, $.Cardinality.Many), null);

export type $OpenAIGPT_3_5_TurboModelλShape = $.typeutil.flatten<$TextGenerationModelλShape & {
}>;
type $OpenAIGPT_3_5_TurboModel = $.ObjectType<"ext::ai::OpenAIGPT_3_5_TurboModel", $OpenAIGPT_3_5_TurboModelλShape, null, [
  ...$TextGenerationModel['__exclusives__'],
]>;
const $OpenAIGPT_3_5_TurboModel = $.makeType<$OpenAIGPT_3_5_TurboModel>(_.spec, "b01401ba-5419-5e67-870e-b4276a47a526", _.syntax.literal);

const OpenAIGPT_3_5_TurboModel: $.$expr_PathNode<$.TypeSet<$OpenAIGPT_3_5_TurboModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($OpenAIGPT_3_5_TurboModel, $.Cardinality.Many), null);

export type $OpenAIGPT_4_TurboModelλShape = $.typeutil.flatten<$TextGenerationModelλShape & {
}>;
type $OpenAIGPT_4_TurboModel = $.ObjectType<"ext::ai::OpenAIGPT_4_TurboModel", $OpenAIGPT_4_TurboModelλShape, null, [
  ...$TextGenerationModel['__exclusives__'],
]>;
const $OpenAIGPT_4_TurboModel = $.makeType<$OpenAIGPT_4_TurboModel>(_.spec, "a9d69c57-a337-5e5c-b089-5a7c110c19fd", _.syntax.literal);

const OpenAIGPT_4_TurboModel: $.$expr_PathNode<$.TypeSet<$OpenAIGPT_4_TurboModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($OpenAIGPT_4_TurboModel, $.Cardinality.Many), null);

export type $OpenAIProviderConfigλShape = $.typeutil.flatten<Omit<$ProviderConfigλShape, "name" | "display_name" | "api_url" | "api_style"> & {
  "name": $.PropertyDesc<_std.$str, $.Cardinality.One, true, false, true, true>;
  "display_name": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, true>;
  "api_url": $.PropertyDesc<_std.$str, $.Cardinality.One, false, false, true, true>;
  "api_style": $.PropertyDesc<$ProviderAPIStyle, $.Cardinality.One, false, false, false, true>;
}>;
type $OpenAIProviderConfig = $.ObjectType<"ext::ai::OpenAIProviderConfig", $OpenAIProviderConfigλShape, null, [
  ...$ProviderConfig['__exclusives__'],
  {name: {__element__: _std.$str, __cardinality__: $.Cardinality.One | $.Cardinality.AtMostOne },},
]>;
const $OpenAIProviderConfig = $.makeType<$OpenAIProviderConfig>(_.spec, "c3e3c79e-2bb1-58fa-8820-2a7cde39e36b", _.syntax.literal);

const OpenAIProviderConfig: $.$expr_PathNode<$.TypeSet<$OpenAIProviderConfig, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($OpenAIProviderConfig, $.Cardinality.Many), null);

export type $OpenAITextEmbedding3LargeModelλShape = $.typeutil.flatten<$EmbeddingModelλShape & {
}>;
type $OpenAITextEmbedding3LargeModel = $.ObjectType<"ext::ai::OpenAITextEmbedding3LargeModel", $OpenAITextEmbedding3LargeModelλShape, null, [
  ...$EmbeddingModel['__exclusives__'],
]>;
const $OpenAITextEmbedding3LargeModel = $.makeType<$OpenAITextEmbedding3LargeModel>(_.spec, "afecd495-1f20-53a5-814f-2a8662aedb37", _.syntax.literal);

const OpenAITextEmbedding3LargeModel: $.$expr_PathNode<$.TypeSet<$OpenAITextEmbedding3LargeModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($OpenAITextEmbedding3LargeModel, $.Cardinality.Many), null);

export type $OpenAITextEmbedding3SmallModelλShape = $.typeutil.flatten<$EmbeddingModelλShape & {
}>;
type $OpenAITextEmbedding3SmallModel = $.ObjectType<"ext::ai::OpenAITextEmbedding3SmallModel", $OpenAITextEmbedding3SmallModelλShape, null, [
  ...$EmbeddingModel['__exclusives__'],
]>;
const $OpenAITextEmbedding3SmallModel = $.makeType<$OpenAITextEmbedding3SmallModel>(_.spec, "26fdc698-c8a7-51b6-a467-92c920d6cb95", _.syntax.literal);

const OpenAITextEmbedding3SmallModel: $.$expr_PathNode<$.TypeSet<$OpenAITextEmbedding3SmallModel, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($OpenAITextEmbedding3SmallModel, $.Cardinality.Many), null);

export type $OpenAITextEmbeddingAda002ModelλShape = $.typeutil.flatten<$EmbeddingModelλShape & {
}>;
type $OpenAITextEmbeddingAda002Model = $.ObjectType<"ext::ai::OpenAITextEmbeddingAda002Model", $OpenAITextEmbeddingAda002ModelλShape, null, [
  ...$EmbeddingModel['__exclusives__'],
]>;
const $OpenAITextEmbeddingAda002Model = $.makeType<$OpenAITextEmbeddingAda002Model>(_.spec, "a6ed4f8e-5803-577d-b767-6393abd9a7b7", _.syntax.literal);

const OpenAITextEmbeddingAda002Model: $.$expr_PathNode<$.TypeSet<$OpenAITextEmbeddingAda002Model, $.Cardinality.Many>, null> = _.syntax.$PathNode($.$toSet($OpenAITextEmbeddingAda002Model, $.Cardinality.Many), null);

type to_contextλFuncExpr<
  P1 extends $.TypeSet<$.AnyObjectType>,
> = $.$expr_Function<
  _std.$str, $.cardutil.paramCardinality<P1>
>;
/**
 * Evaluate the expression of an ai::index defined on the passed object type and return it.
 */
function to_context<
  P1 extends $.TypeSet<$.AnyObjectType>,
>(
  object: P1,
): to_contextλFuncExpr<P1>;
function to_context(...args: any[]) {
  const {returnType, cardinality, args: positionalArgs, namedArgs} = _.syntax.$resolveOverload('ext::ai::to_context', args, _.spec, [
    {args: [{typeId: "00000000-0000-0000-0000-000000000003", optional: false, setoftype: false, variadic: false}], returnTypeId: "00000000-0000-0000-0000-000000000101"},
  ]);
  return _.syntax.$expressionify({
    __kind__: $.ExpressionKind.Function,
    __element__: returnType,
    __cardinality__: cardinality,
    __name__: "ext::ai::to_context",
    __args__: positionalArgs,
    __namedargs__: namedArgs,
  }) as any;
};

type searchλFuncExpr<
  P1 extends $.TypeSet<$.AnyObjectType>,
  P2 extends $.TypeSet<$.ArrayType<_std.$float32>>,
> = $.$expr_Function<
  $.NamedTupleType<{object: $.AnyObjectType, distance: _std.$float64}>, $.cardutil.overrideLowerBound<$.cardutil.multiplyCardinalities<$.cardutil.paramCardinality<P1>, $.cardutil.paramCardinality<P2>>, "Zero">
>;
/**
 * 
        Search an object using its ext::ai::index index.
        Returns objects that match the specified semantic query and the
        similarity score.
    
 */
function search<
  P1 extends $.TypeSet<$.AnyObjectType>,
  P2 extends $.TypeSet<$.ArrayType<_std.$float32>>,
>(
  object: P1,
  query: P2,
): searchλFuncExpr<P1, P2>;
function search(...args: any[]) {
  const {returnType, cardinality, args: positionalArgs, namedArgs} = _.syntax.$resolveOverload('ext::ai::search', args, _.spec, [
    {args: [{typeId: "00000000-0000-0000-0000-000000000003", optional: false, setoftype: false, variadic: false}, {typeId: "a2e5149c-6c82-58a4-a588-c4a064088ad5", optional: false, setoftype: false, variadic: false}], returnTypeId: "e192a3f3-7f95-53e9-a954-697d4bebfd84", returnTypemod: "OptionalType"},
  ]);
  return _.syntax.$expressionify({
    __kind__: $.ExpressionKind.Function,
    __element__: returnType,
    __cardinality__: cardinality,
    __name__: "ext::ai::search",
    __args__: positionalArgs,
    __namedargs__: namedArgs,
  }) as any;
};



export { ChatParticipantRole, DistanceFunction, IndexType, ProviderAPIStyle, $Model, Model, $TextGenerationModel, TextGenerationModel, $AnthropicClaude3HaikuModel, AnthropicClaude3HaikuModel, $AnthropicClaude3OpusModel, AnthropicClaude3OpusModel, $AnthropicClaude3SonnetModel, AnthropicClaude3SonnetModel, $ProviderConfig, ProviderConfig, $AnthropicProviderConfig, AnthropicProviderConfig, $ChatPrompt, ChatPrompt, $ChatPromptMessage, ChatPromptMessage, $Config, Config, $CustomProviderConfig, CustomProviderConfig, $EmbeddingModel, EmbeddingModel, $MistralEmbedModel, MistralEmbedModel, $MistralLargeModel, MistralLargeModel, $MistralMediumModel, MistralMediumModel, $MistralProviderConfig, MistralProviderConfig, $MistralSmallModel, MistralSmallModel, $OpenAIGPT_3_5_TurboModel, OpenAIGPT_3_5_TurboModel, $OpenAIGPT_4_TurboModel, OpenAIGPT_4_TurboModel, $OpenAIProviderConfig, OpenAIProviderConfig, $OpenAITextEmbedding3LargeModel, OpenAITextEmbedding3LargeModel, $OpenAITextEmbedding3SmallModel, OpenAITextEmbedding3SmallModel, $OpenAITextEmbeddingAda002Model, OpenAITextEmbeddingAda002Model };

type __defaultExports = {
  "ChatParticipantRole": typeof ChatParticipantRole;
  "DistanceFunction": typeof DistanceFunction;
  "IndexType": typeof IndexType;
  "ProviderAPIStyle": typeof ProviderAPIStyle;
  "Model": typeof Model;
  "TextGenerationModel": typeof TextGenerationModel;
  "AnthropicClaude3HaikuModel": typeof AnthropicClaude3HaikuModel;
  "AnthropicClaude3OpusModel": typeof AnthropicClaude3OpusModel;
  "AnthropicClaude3SonnetModel": typeof AnthropicClaude3SonnetModel;
  "ProviderConfig": typeof ProviderConfig;
  "AnthropicProviderConfig": typeof AnthropicProviderConfig;
  "ChatPrompt": typeof ChatPrompt;
  "ChatPromptMessage": typeof ChatPromptMessage;
  "Config": typeof Config;
  "CustomProviderConfig": typeof CustomProviderConfig;
  "EmbeddingModel": typeof EmbeddingModel;
  "MistralEmbedModel": typeof MistralEmbedModel;
  "MistralLargeModel": typeof MistralLargeModel;
  "MistralMediumModel": typeof MistralMediumModel;
  "MistralProviderConfig": typeof MistralProviderConfig;
  "MistralSmallModel": typeof MistralSmallModel;
  "OpenAIGPT_3_5_TurboModel": typeof OpenAIGPT_3_5_TurboModel;
  "OpenAIGPT_4_TurboModel": typeof OpenAIGPT_4_TurboModel;
  "OpenAIProviderConfig": typeof OpenAIProviderConfig;
  "OpenAITextEmbedding3LargeModel": typeof OpenAITextEmbedding3LargeModel;
  "OpenAITextEmbedding3SmallModel": typeof OpenAITextEmbedding3SmallModel;
  "OpenAITextEmbeddingAda002Model": typeof OpenAITextEmbeddingAda002Model;
  "to_context": typeof to_context;
  "search": typeof search
};
const __defaultExports: __defaultExports = {
  "ChatParticipantRole": ChatParticipantRole,
  "DistanceFunction": DistanceFunction,
  "IndexType": IndexType,
  "ProviderAPIStyle": ProviderAPIStyle,
  "Model": Model,
  "TextGenerationModel": TextGenerationModel,
  "AnthropicClaude3HaikuModel": AnthropicClaude3HaikuModel,
  "AnthropicClaude3OpusModel": AnthropicClaude3OpusModel,
  "AnthropicClaude3SonnetModel": AnthropicClaude3SonnetModel,
  "ProviderConfig": ProviderConfig,
  "AnthropicProviderConfig": AnthropicProviderConfig,
  "ChatPrompt": ChatPrompt,
  "ChatPromptMessage": ChatPromptMessage,
  "Config": Config,
  "CustomProviderConfig": CustomProviderConfig,
  "EmbeddingModel": EmbeddingModel,
  "MistralEmbedModel": MistralEmbedModel,
  "MistralLargeModel": MistralLargeModel,
  "MistralMediumModel": MistralMediumModel,
  "MistralProviderConfig": MistralProviderConfig,
  "MistralSmallModel": MistralSmallModel,
  "OpenAIGPT_3_5_TurboModel": OpenAIGPT_3_5_TurboModel,
  "OpenAIGPT_4_TurboModel": OpenAIGPT_4_TurboModel,
  "OpenAIProviderConfig": OpenAIProviderConfig,
  "OpenAITextEmbedding3LargeModel": OpenAITextEmbedding3LargeModel,
  "OpenAITextEmbedding3SmallModel": OpenAITextEmbedding3SmallModel,
  "OpenAITextEmbeddingAda002Model": OpenAITextEmbeddingAda002Model,
  "to_context": to_context,
  "search": search
};
export default __defaultExports;
