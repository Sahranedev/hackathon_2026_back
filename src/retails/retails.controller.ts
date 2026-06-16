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
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { RolesGuard } from 'src/security/guards/roles.guard';

@UseGuards(RolesGuard, JwtAuthGuard)
@Roles(Role.Admin)
@Controller('api/retails')
export class RetailsController {
  constructor(private readonly retailsService: RetailsService) {}

  @Post()
  create(@Body() createRetailDto: CreateRetailDto) {
    return this.retailsService.create(createRetailDto);
  }

  @Get()
  findAll() {
    return this.retailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.retailsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRetailDto: UpdateRetailDto,
  ) {
    return this.retailsService.update(id, updateRetailDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.retailsService.remove(id);
  }
}
