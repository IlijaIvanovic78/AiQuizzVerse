import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../users/users.types';
import { AuthService } from './auth.service';
import { AuthResponse, LoginResult, TwoFactorSetup } from './auth.types';
import { CurrentUserId } from './decorators/current-user-id.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TwoFactorCodeDto } from './dto/two-factor-code.dto';
import { TwoFactorLoginDto } from './dto/two-factor-login.dto';
import { UsernameQueryDto } from './dto/username-query.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { TwoFactorService } from './two-factor.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly twoFactor: TwoFactorService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.auth.register(dto);
  }

  // The throttler runs first, so wrong passwords count towards the limit too.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  login(@CurrentUserId() userId: string): Promise<LoginResult> {
    return this.auth.login(userId);
  }

  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  loginWithTwoFactor(@Body() dto: TwoFactorLoginDto): Promise<AuthResponse> {
    return this.auth.loginWithTwoFactor(dto.twoFactorToken, dto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth('refresh-token')
  refresh(@CurrentUserId() userId: string): Promise<AuthResponse> {
    return this.auth.refresh(userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  logout(@CurrentUserId() userId: string): Promise<void> {
    return this.auth.logout(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  me(@CurrentUserId() userId: string): Promise<CurrentUser> {
    return this.users.findCurrentUser(userId);
  }

  @Get('username-available')
  async usernameAvailable(@Query() query: UsernameQueryDto): Promise<{ available: boolean }> {
    return { available: await this.auth.isUsernameAvailable(query.username) };
  }

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  setupTwoFactor(@CurrentUserId() userId: string): Promise<TwoFactorSetup> {
    return this.twoFactor.setup(userId);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiBearerAuth('access-token')
  enableTwoFactor(
    @CurrentUserId() userId: string,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<CurrentUser> {
    return this.twoFactor.enable(userId, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiBearerAuth('access-token')
  disableTwoFactor(
    @CurrentUserId() userId: string,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<CurrentUser> {
    return this.twoFactor.disable(userId, dto.code);
  }
}
