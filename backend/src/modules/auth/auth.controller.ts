import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { RegisterDto, LoginDto, TwoFactorDto, Login2FADto } from './dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { RequestUser } from '../../shared/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // ==================== REGISTER ====================
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or username already taken' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ==================== LOGIN ====================
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns JWT tokens or 2FA required flag' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse | { is2FARequired: true; userId: string }> {
    return this.authService.login(loginDto);
  }

  // ==================== LOGIN WITH 2FA ====================
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete login with 2FA code' })
  @ApiResponse({ status: 200, description: 'Returns JWT tokens after 2FA verification' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  async login2FA(@Body() login2FADto: Login2FADto): Promise<AuthResponse> {
    return this.authService.login2FA(login2FADto.userId, login2FADto.token);
  }

  // ==================== REFRESH TOKENS ====================
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBearerAuth('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Returns new JWT tokens' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshTokens(@CurrentUser() user: RequestUser): Promise<AuthResponse> {
    return this.authService.refreshTokens(user.userId, user.refreshToken!);
  }

  // ==================== LOGOUT ====================
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — invalidates refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId);
  }

  // ==================== GET PROFILE ====================
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile without sensitive data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('userId') userId: string) {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      return null;
    }

    // Don't return sensitive fields
    const { passwordHash, refreshToken, twoFaSecret, ...safeUser } = user;

    return safeUser;
  }

  // ==================== ENABLE 2FA ====================
  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate QR code for 2FA setup' })
  @ApiResponse({ status: 200, description: 'Returns secret and QR code data URL' })
  async enable2FA(@CurrentUser('userId') userId: string) {
    return this.authService.enable2FA(userId);
  }

  // ==================== VERIFY 2FA ====================
  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code and enable 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  async verify2FA(
    @CurrentUser('userId') userId: string,
    @Body() twoFactorDto: TwoFactorDto,
  ) {
    return this.authService.verify2FA(userId, twoFactorDto.token);
  }

  // ==================== DISABLE 2FA ====================
  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA on account' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: '2FA is not enabled' })
  async disable2FA(@CurrentUser('userId') userId: string) {
    return this.authService.disable2FA(userId);
  }

  // ==================== CHECK USERNAME AVAILABILITY ====================
  @Get('check-username/:username')
  @ApiOperation({ summary: 'Check if username is available' })
  @ApiResponse({ status: 200, description: 'Returns { available: boolean }' })
  async checkUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);

    return {
      available: !user,
    };
  }

  // ==================== CHECK EMAIL AVAILABILITY ====================
  @Get('check-email/:email')
  @ApiOperation({ summary: 'Check if email is available' })
  @ApiResponse({ status: 200, description: 'Returns { available: boolean }' })
  async checkEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);

    return {
      available: !user,
    };
  }
}
