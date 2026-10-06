import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { ProfileApiService } from '../../core/api/profile-api.service';
import { ToastService } from '../../core/notifications/toast.service';
import { SoundService } from '../../core/sound/sound.service';
import { EquipmentActions } from './equipment.actions';

@Injectable()
export class EquipmentEffects {
  private readonly actions$ = inject(Actions);
  private readonly profileApi = inject(ProfileApiService);
  private readonly toast = inject(ToastService);
  private readonly sound = inject(SoundService);

  readonly equipItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActions.equipItem),
      exhaustMap(({ itemId }) =>
        this.profileApi.equipItem(itemId).pipe(
          map((user) => EquipmentActions.itemEquipped({ user })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly unequipPet$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActions.unequipPet),
      exhaustMap(() =>
        this.profileApi.unequipPet().pipe(
          map((user) => EquipmentActions.petUnequipped({ user })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  // The clink plays the moment Equip is pressed, in the wardrobe or on a chest reward, so the
  // click sound of that button stays quiet.
  readonly clinkEquip$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(EquipmentActions.equipItem),
        tap(() => this.sound.playEquip()),
      ),
    { dispatch: false },
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(EquipmentActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  private failed(error: unknown): Action {
    return EquipmentActions.failed({ error: readErrorMessage(error) });
  }
}
