import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '../enums';
import { normalizeRole } from './role.utils';

@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userRole = normalizeRole(request.user?.role);
    const isManagerGroup = request.user?.groups?.some(
      (group: string) => group.toUpperCase() === UserRole.MANAGER,
    );

    if (userRole !== UserRole.MANAGER && !isManagerGroup) {
      throw new ForbiddenException('Manager access required');
    }

    return true;
  }
}
