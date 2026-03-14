export * from './auth.module';
export * from './auth.service';
export * from './auth.controller';
export * from './guards/jwt-refresh.guard';
export * from './dto';

// Re-export shared guards/decorators for backward compatibility
export * from '../../shared/guards/jwt-auth.guard';
export * from '../../shared/decorators/current-user.decorator';
