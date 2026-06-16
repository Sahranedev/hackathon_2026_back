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
import { CreateRetailDto } from './dto/create-retail.dto';
import { UpdateRetailDto } from './dto/update-retail.dto';
import { RetailsService } from './retails.service';
import { Roles } from '../security/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { RolesGuard } from '../security/guards/roles.guard';

@UseGuards(RolesGuard)
@Controller('api/retails')
export class RetailsController {
  constructor(private readonly retailsService: RetailsService) {}

  @Roles(Role.Admin)
  @Post()
  create(@Body() createRetailDto: CreateRetailDto) {
    return this.retailsService.create(createRetailDto);
  }

  @Roles(Role.User, Role.Admin)
  @Get()
  findAll() {
    return this.retailsService.findAll();
  }

  @Roles(Role.User, Role.Admin)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.retailsService.findOne(id);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRetailDto: UpdateRetailDto,
  ) {
    return this.retailsService.update(id, updateRetailDto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.retailsService.remove(id);
  }
}
