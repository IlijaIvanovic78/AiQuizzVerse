import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';
import { PaymentsService } from './payments.service';
import { CheckoutSession, CoinPackage, PurchaseConfirmation, PurchaseView } from './payments.types';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('packages')
  listPackages(): CoinPackage[] {
    return this.payments.listPackages();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  listHistory(@CurrentUserId() userId: string): Promise<PurchaseView[]> {
    return this.payments.listHistory(userId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  checkout(@CurrentUserId() userId: string, @Body() dto: CheckoutDto): Promise<CheckoutSession> {
    return this.payments.checkout(userId, dto.packageId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  getPurchase(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) purchaseId: string,
  ): Promise<PurchaseView> {
    return this.payments.getPurchase(userId, purchaseId);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  confirm(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) purchaseId: string,
  ): Promise<PurchaseConfirmation> {
    return this.payments.confirm(userId, purchaseId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  cancel(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) purchaseId: string,
  ): Promise<PurchaseView> {
    return this.payments.cancel(userId, purchaseId);
  }
}
