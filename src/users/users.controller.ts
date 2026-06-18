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
import { Public } from '../security/decorators/public.decorator';
import { Roles } from '../security/decorators/roles.decorator';
import { RolesGuard } from '../security/guards/roles.guard';
import { Role } from './enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAccountTypeDto } from './dto/update-account-type.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { SafeUserResponseDto } from '../docs/api-response.dto';
import {
  ApiJwtAuth,
  ApiResourceNotFound,
  ApiRoleAccess,
} from '../docs/swagger.decorators';

@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Creer un utilisateur.' })
  @ApiCreatedResponse({
    description: 'Utilisateur cree sans exposer son mot de passe.',
    type: SafeUserResponseDto,
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Lister les utilisateurs.' })
  @ApiOkResponse({ type: [SafeUserResponseDto] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Recuperer un utilisateur par identifiant.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: SafeUserResponseDto })
  @ApiResourceNotFound('Utilisateur introuvable.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Modifier les informations d un utilisateur.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: SafeUserResponseDto })
  @ApiResourceNotFound('Utilisateur introuvable.')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Patch(':id/account-type')
  @ApiRoleAccess(Role.Admin)
  @ApiOperation({ summary: 'Modifier le type de compte d un utilisateur.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: SafeUserResponseDto })
  @ApiResourceNotFound('Utilisateur introuvable.')
  updateAccountType(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountTypeDto: UpdateAccountTypeDto,
  ) {
    return this.usersService.updateAccountType(
      id,
      updateAccountTypeDto.accountType,
    );
  }

  @Delete(':id')
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Supprimer un utilisateur.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Utilisateur supprime.', type: SafeUserResponseDto })
  @ApiResourceNotFound('Utilisateur introuvable.')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
