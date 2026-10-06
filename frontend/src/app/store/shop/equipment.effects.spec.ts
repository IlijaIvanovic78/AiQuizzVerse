import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { ProfileApiService } from '../../core/api/profile-api.service';
import { CurrentUser } from '../../core/models/user.model';
import { ToastService } from '../../core/notifications/toast.service';
import { SoundService } from '../../core/sound/sound.service';
import { EquipmentActions } from './equipment.actions';
import { EquipmentEffects } from './equipment.effects';

const user: CurrentUser = {
  id: 'hero',
  username: 'demo_hero',
  avatarKey: 'mini-knight',
  petKey: null,
  level: 3,
  email: 'hero@example.com',
  xp: 400,
  coins: 300,
  streak: 2,
  longestStreak: 5,
  streakFreezes: 0,
  twoFaEnabled: false,
  xpIntoLevel: 100,
  xpForNextLevel: 300,
  sabotages: ['INK'],
};

const notOwned = new HttpErrorResponse({
  status: 400,
  error: { message: 'Sabotages are not worn. They work in party matches.' },
});

const profileApi = { equipItem: vi.fn(), unequipPet: vi.fn() };
const toast = { error: vi.fn() };
const sound = { playEquip: vi.fn() };

function effectsFor(action: Action): EquipmentEffects {
  TestBed.configureTestingModule({
    providers: [
      EquipmentEffects,
      provideMockActions((): Observable<Action> => of(action)),
      { provide: ProfileApiService, useValue: profileApi },
      { provide: ToastService, useValue: toast },
      { provide: SoundService, useValue: sound },
    ],
  });
  return TestBed.inject(EquipmentEffects);
}

describe('EquipmentEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('equips the item on the server and passes on the updated player', async () => {
    profileApi.equipItem.mockReturnValue(of(user));
    const effects = effectsFor(EquipmentActions.equipItem({ itemId: 'mini-knight' }));

    const result = await firstValueFrom(effects.equipItem$);

    expect(profileApi.equipItem).toHaveBeenCalledWith('mini-knight');
    expect(result).toEqual(EquipmentActions.itemEquipped({ user }));
  });

  it('turns a refused equip into a failure with the server message', async () => {
    profileApi.equipItem.mockReturnValue(throwError(() => notOwned));
    const effects = effectsFor(EquipmentActions.equipItem({ itemId: 'sabotage-fog' }));

    const result = await firstValueFrom(effects.equipItem$);

    expect(result).toEqual(
      EquipmentActions.failed({ error: 'Sabotages are not worn. They work in party matches.' }),
    );
  });

  it('takes the pet off on the server', async () => {
    profileApi.unequipPet.mockReturnValue(of(user));
    const effects = effectsFor(EquipmentActions.unequipPet());

    const result = await firstValueFrom(effects.unequipPet$);

    expect(result).toEqual(EquipmentActions.petUnequipped({ user }));
  });

  it('clinks once the moment Equip is pressed', async () => {
    const effects = effectsFor(EquipmentActions.equipItem({ itemId: 'mini-knight' }));

    await firstValueFrom(effects.clinkEquip$);

    expect(sound.playEquip).toHaveBeenCalledTimes(1);
  });

  it('shows a failure as an error toast', async () => {
    const effects = effectsFor(EquipmentActions.failed({ error: 'Server is busy.' }));

    await firstValueFrom(effects.showError$);

    expect(toast.error).toHaveBeenCalledWith('Server is busy.');
  });
});
