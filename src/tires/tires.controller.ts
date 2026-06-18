import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { CreateUserTireDto } from './dto/create-user-tire.dto';
import { UpdateUserTireActiveDto } from './dto/update-user-tire-active.dto';
import { TiresService } from './tires.service';
import {
  DeletedResponseDto,
  TireCatalogItemResponseDto,
  TireDealerResponseDto,
  TireDetailResponseDto,
  UserTireActiveResponseDto,
  UserTireInfoResponseDto,
  UserTireSummaryResponseDto,
  UserTireWearResponseDto,
} from '../docs/api-response.dto';
import {
  ApiConflictError,
  ApiJwtAuth,
  ApiResourceNotFound,
} from '../docs/swagger.decorators';

@UseGuards(JwtAuthGuard)
@ApiTags('Tires')
@ApiJwtAuth()
@Controller('api/tires')
export class TiresController {
  constructor(private readonly tiresService: TiresService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Lister les pneus de l utilisateur courant.' })
  @ApiOkResponse({ type: [UserTireSummaryResponseDto] })
  getUserTires(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.tiresService.getUserTires(authenticatedUser.id);
  }

  @Post('mine')
  @ApiOperation({ summary: 'Ajouter un pneu du catalogue a l utilisateur courant.' })
  @ApiCreatedResponse({ type: UserTireSummaryResponseDto })
  @ApiResourceNotFound('Modele de pneu introuvable.')
  @ApiConflictError('Un utilisateur ne peut avoir que jusqu a 2 pneus actifs.')
  addUserTire(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() createUserTireDto: CreateUserTireDto,
  ) {
    return this.tiresService.addUserTire(
      authenticatedUser.id,
      createUserTireDto.tireId,
    );
  }

  @Get('mine/:id/info')
  @ApiOperation({ summary: 'Recuperer les informations rapides d un pneu utilisateur.' })
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiOkResponse({ type: UserTireInfoResponseDto })
  @ApiResourceNotFound('Pneu utilisateur introuvable.')
  getUserTireInfo(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tiresService.getUserTireInfo(authenticatedUser.id, id);
  }

  @Get('mine/:id/wear')
  @ApiOperation({ summary: 'Recuperer l etat d usure estime d un pneu utilisateur.' })
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiOkResponse({ type: UserTireWearResponseDto })
  @ApiResourceNotFound('Pneu utilisateur introuvable.')
  getUserTireWear(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tiresService.getUserTireWear(authenticatedUser.id, id);
  }

  @Patch('mine/:id/active')
  @ApiOperation({ summary: 'Activer ou desactiver un pneu utilisateur.' })
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiOkResponse({ type: UserTireActiveResponseDto })
  @ApiResourceNotFound('Pneu utilisateur introuvable.')
  @ApiConflictError('Un utilisateur ne peut avoir que jusqu a 2 pneus actifs.')
  updateUserTireActive(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserTireActiveDto: UpdateUserTireActiveDto,
  ) {
    return this.tiresService.updateUserTireActive(
      authenticatedUser.id,
      id,
      updateUserTireActiveDto.isActive,
    );
  }

  @Delete('mine/:id')
  @ApiOperation({ summary: 'Supprimer un pneu utilisateur.' })
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiOkResponse({ type: DeletedResponseDto })
  @ApiResourceNotFound('Pneu utilisateur introuvable.')
  deleteUserTire(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tiresService.deleteUserTire(authenticatedUser.id, id);
  }

  @Get('catalog/search')
  @ApiOperation({ summary: 'Rechercher un modele dans le catalogue pneus.' })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    example: 'Power',
    description: 'Recherche insensible a la casse sur le nom du modele.',
  })
  @ApiOkResponse({ type: [TireCatalogItemResponseDto] })
  searchTireCatalog(@Query('q') query = '') {
    return this.tiresService.searchTireCatalog(query);
  }

  @Get('/model/:id')
  @ApiOperation({ summary: 'Recuperer le detail technique d un modele de pneu.' })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiOkResponse({ type: TireDetailResponseDto })
  @ApiResourceNotFound('Modele de pneu introuvable.')
  getTireModelDetail(@Param('id', ParseIntPipe) id: number) {
    return this.tiresService.getTireModelDetail(id);
  }

  @Get('model/:id/dealers')
  @ApiOperation({ summary: 'Lister les points de vente associes a un modele de pneu.' })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiOkResponse({ type: [TireDealerResponseDto] })
  @ApiResourceNotFound('Modele de pneu introuvable.')
  getTireDealers(@Param('id', ParseIntPipe) id: number) {
    return this.tiresService.getTireDealers(id);
  }
}
