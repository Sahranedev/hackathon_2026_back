import { Injectable, NotFoundException } from '@nestjs/common';
import { Retail } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRetailDto } from './dto/create-retail.dto';
import { UpdateRetailDto } from './dto/update-retail.dto';

@Injectable()
export class RetailsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createRetailDto: CreateRetailDto): Promise<Retail> {
    return this.prisma.retail.create({
      data: createRetailDto,
    });
  }

  findAll(): Promise<Retail[]> {
    return this.prisma.retail.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number): Promise<Retail> {
    const retail = await this.prisma.retail.findUnique({
      where: { id },
    });

    if (!retail) {
      throw new NotFoundException(`Retail ${id} not found`);
    }

    return retail;
  }

  async update(id: number, updateRetailDto: UpdateRetailDto): Promise<Retail> {
    await this.findOne(id);

    return this.prisma.retail.update({
      where: { id },
      data: updateRetailDto,
    });
  }

  async remove(id: number): Promise<Retail> {
    await this.findOne(id);

    return this.prisma.retail.delete({
      where: { id },
    });
  }
}
