import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MonadService } from '../../application/service/monad.service';

@Controller('api')
export class MonadController {
  constructor(private readonly monadService: MonadService) {}

  @Post('monad/user')
  createUser(@Body('address') address: string) {
    return this.monadService.createUser(address);
  }

  @Post('monad/user/attack')
  attackEnemy(@Body('address') address: string) {
    return this.monadService.attackEnemy(address);
  }

  @Get('monad/user/:address')
  getUser(@Param('address') address: string) {
    return this.monadService.getUser(address);
  }
}
