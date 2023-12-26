import { Module } from '@nestjs/common';
import { Gateway } from './gateway';
import { GatewayService } from './gateway.service';

@Module({
  providers: [Gateway, GatewayService]
})
export class GatewayModule {}
