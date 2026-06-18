import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';
import { AddGpsPointDto } from './dto/add-gps-point.dto';
import { FinishActivityDto } from './dto/finish-activity.dto';
import { StartActivityDto } from './dto/start-activity.dto';
import {
  ActivityDetailResponseDto,
  ActivityGpsPointResponseDto,
  ActivityResponseDto,
  DeletedResponseDto,
  TerrainTypeResponseDto,
} from '../docs/api-response.dto';
import {
  ApiJwtAuth,
  ApiResourceNotFound,
  ApiValidationError,
} from '../docs/swagger.decorators';

@ApiTags('Activities')
@ApiJwtAuth()
@Controller('/api/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les activites de l utilisateur courant.',
    description:
      'Synchronise les activites Strava si un compte est lie et si la derniere synchronisation date de plus de 15 minutes.',
  })
  @ApiOkResponse({ type: [ActivityResponseDto] })
  async findAll(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.activitiesService.findAll(authenticatedUser.id);
  }

  @Post('start')
  @ApiOperation({ summary: 'Demarrer une activite suivie par l application.' })
  @ApiCreatedResponse({ type: ActivityResponseDto })
  @ApiValidationError('Une activite app-tracked est deja en cours.')
  async start(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() startActivityDto: StartActivityDto,
  ) {
    return this.activitiesService.startActivity(
      authenticatedUser.id,
      startActivityDto,
    );
  }

  @Get('terrain-types')
  @ApiOperation({ summary: 'Lister les types de terrain disponibles.' })
  @ApiOkResponse({ type: [TerrainTypeResponseDto] })
  getTerrainTypes() {
    return this.activitiesService.getTerrainTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recuperer le detail d une activite.' })
  @ApiParam({ name: 'id', type: Number, example: 44 })
  @ApiOkResponse({ type: ActivityDetailResponseDto })
  @ApiResourceNotFound('Activite introuvable.')
  async findOne(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.activitiesService.findOne(authenticatedUser.id, id);
  }

  @Post(':id/points')
  @ApiOperation({ summary: 'Ajouter un point GPS a une activite en cours.' })
  @ApiParam({ name: 'id', type: Number, example: 44 })
  @ApiCreatedResponse({ type: ActivityGpsPointResponseDto })
  @ApiValidationError("L'activite n'est pas en cours.")
  @ApiResourceNotFound('Activite app-tracked introuvable.')
  async addGpsPoint(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() addGpsPointDto: AddGpsPointDto,
  ) {
    return this.activitiesService.addGpsPoint(
      authenticatedUser.id,
      id,
      addGpsPointDto,
    );
  }

  @Post(':id/finish')
  @ApiOperation({ summary: 'Terminer une activite suivie par l application.' })
  @ApiParam({ name: 'id', type: Number, example: 44 })
  @ApiCreatedResponse({ type: ActivityResponseDto })
  @ApiValidationError("L'activite n'est pas en cours.")
  @ApiResourceNotFound('Activite app-tracked introuvable.')
  async finish(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() finishActivityDto: FinishActivityDto,
  ) {
    return this.activitiesService.finishActivity(
      authenticatedUser.id,
      id,
      finishActivityDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une activite app-tracked en cours.' })
  @ApiParam({ name: 'id', type: Number, example: 44 })
  @ApiOkResponse({ type: DeletedResponseDto })
  @ApiValidationError(
    'Seules les activites app-tracked en cours peuvent etre supprimees.',
  )
  @ApiResourceNotFound('Activite app-tracked introuvable.')
  async delete(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.activitiesService.deleteActivity(authenticatedUser.id, id);
  }
}
