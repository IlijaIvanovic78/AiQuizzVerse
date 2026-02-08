import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: string;
  email: string;
  refreshToken?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    if (!user) {
      return null;
    }

    // If a specific property is requested, return only that property
    if (data) {
      return user[data];
    }

    // Return the entire user object
    return user;
  },
);
