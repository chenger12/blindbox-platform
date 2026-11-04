import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameId } from '../models/theme/theme.model';
import { GameRegistryService } from '../services/game-registry/game-registry.service';

/** Blocks routes of games the admin has hidden in the back office. */
export const gameEnabledGuard: CanActivateFn = route => {
  const id = route.data['gameId'] as GameId;
  return inject(GameRegistryService).isEnabled(id) || inject(Router).createUrlTree(['/']);
};
