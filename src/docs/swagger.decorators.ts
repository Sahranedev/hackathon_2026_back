import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from './api-response.dto';

export const ApiJwtAuth = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'JWT manquant, invalide ou expire.',
      type: ErrorResponseDto,
    }),
  );

export const ApiRoleAccess = (...roles: string[]) =>
  applyDecorators(
    ApiJwtAuth(),
    ApiForbiddenResponse({
      description: `Acces reserve aux roles: ${roles.join(', ')}.`,
      type: ErrorResponseDto,
    }),
  );

export const ApiValidationError = (description = 'Requete invalide.') =>
  ApiBadRequestResponse({
    description,
    type: ErrorResponseDto,
  });

export const ApiResourceNotFound = (description = 'Ressource introuvable.') =>
  ApiNotFoundResponse({
    description,
    type: ErrorResponseDto,
  });

export const ApiConflictError = (description = 'Conflit metier.') =>
  ApiConflictResponse({
    description,
    type: ErrorResponseDto,
  });
