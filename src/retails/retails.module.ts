import { Module } from '@nestjs/common';
import { RetailsController } from './retails.controller';
import { RetailsService } from './retails.service';

@Module({
  controllers: [RetailsController],
  providers: [RetailsService],
  exports: [RetailsService],
})
export class RetailsModule {}
