import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TiresController } from './tires.controller';
import { TiresService } from './tires.service';
import { UserTiresService } from './user-tires.service';

@Module({
  imports: [PrismaModule],
  controllers: [TiresController],
  providers: [TiresService, UserTiresService],
  exports: [TiresService, UserTiresService],
})
export class TiresModule {}
