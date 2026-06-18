import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRetailDto } from './dto/create-retail.dto';
import { UpdateRetailDto } from './dto/update-retail.dto';
import { RetailsService } from './retails.service';
import { Roles } from '../security/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { RolesGuard } from '../security/guards/roles.guard';
import { RetailResponseDto } from '../docs/api-response.dto';
import {
  ApiResourceNotFound,
  ApiRoleAccess,
} from '../docs/swagger.decorators';

@UseGuards(RolesGuard)
@ApiTags('Retails')
@Controller('api/retails')
export class RetailsController {
  constructor(private readonly retailsService: RetailsService) {}

  @Roles(Role.Admin)
  @Post()
  @ApiRoleAccess(Role.Admin)
  @ApiOperation({ summary: 'Creer un point de vente.' })
  @ApiCreatedResponse({ type: RetailResponseDto })
  create(@Body() createRetailDto: CreateRetailDto) {
    return this.retailsService.create(createRetailDto);
  }

  @Roles(Role.User, Role.Admin)
  @Get()
  @ApiRoleAccess(Role.User, Role.Admin)
  @ApiOperation({ summary: 'Lister les points de vente.' })
  @ApiOkResponse({ type: [RetailResponseDto] })
  findAll() {
    return this.retailsService.findAll();
  }

  @Roles(Role.User, Role.Admin)
  @Get(':id')
  @ApiRoleAccess(Role.User, Role.Admin)
  @ApiOperation({ summary: 'Recuperer un point de vente.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: RetailResponseDto })
  @ApiResourceNotFound('Point de vente introuvable.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.retailsService.findOne(id);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  @ApiRoleAccess(Role.Admin)
  @ApiOperation({ summary: 'Modifier un point de vente.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: RetailResponseDto })
  @ApiResourceNotFound('Point de vente introuvable.')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRetailDto: UpdateRetailDto,
  ) {
    return this.retailsService.update(id, updateRetailDto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  @ApiRoleAccess(Role.Admin)
  @ApiOperation({ summary: 'Supprimer un point de vente.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: RetailResponseDto })
  @ApiResourceNotFound('Point de vente introuvable.')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.retailsService.remove(id);
  }
}
