import { applyDecorators, type Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { ApiResponseBaseDto } from "./api-response.dto";

export function ApiOkEnvelope<TModel extends Type<unknown>>(dataModel: TModel) {
  return applyDecorators(
    ApiExtraModels(ApiResponseBaseDto, dataModel),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseBaseDto) },
          { properties: { data: { $ref: getSchemaPath(dataModel) } } },
        ],
      },
    }),
  );
}

export function ApiOkEnvelopeNullable<TModel extends Type<unknown>>(dataModel: TModel) {
  return applyDecorators(
    ApiExtraModels(ApiResponseBaseDto, dataModel),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseBaseDto) },
          { properties: { data: { $ref: getSchemaPath(dataModel), nullable: true } } },
        ],
      },
    }),
  );
}
