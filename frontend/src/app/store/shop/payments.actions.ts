import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CheckoutSession, CoinPackage, PurchaseView } from '../../core/models/payment.model';

export const PaymentsActions = createActionGroup({
  source: 'Payments',
  events: {
    'Load Packages': emptyProps(),
    'Packages Loaded': props<{ packages: CoinPackage[] }>(),
    Checkout: props<{ packageId: string }>(),
    'Checkout Opened': props<{ session: CheckoutSession }>(),
    'Load Purchase': props<{ purchaseId: string }>(),
    'Purchase Loaded': props<{ purchase: PurchaseView }>(),
    'Confirm Purchase': props<{ purchaseId: string }>(),
    'Purchase Confirmed': props<{ purchase: PurchaseView; coins: number }>(),
    'Cancel Purchase': props<{ purchaseId: string }>(),
    'Purchase Cancelled': props<{ purchase: PurchaseView }>(),
    'Load History': emptyProps(),
    'History Loaded': props<{ purchases: PurchaseView[] }>(),
    Failed: props<{ error: string }>(),
  },
});
