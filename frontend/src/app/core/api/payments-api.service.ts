import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CheckoutRequest,
  CheckoutSession,
  CoinPackage,
  PurchaseConfirmation,
  PurchaseView,
} from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  packages(): Observable<CoinPackage[]> {
    return this.http.get<CoinPackage[]>(`${this.baseUrl}/packages`);
  }

  history(): Observable<PurchaseView[]> {
    return this.http.get<PurchaseView[]>(`${this.baseUrl}/history`);
  }

  checkout(request: CheckoutRequest): Observable<CheckoutSession> {
    return this.http.post<CheckoutSession>(`${this.baseUrl}/checkout`, request);
  }

  get(purchaseId: string): Observable<PurchaseView> {
    return this.http.get<PurchaseView>(`${this.baseUrl}/${purchaseId}`);
  }

  confirm(purchaseId: string): Observable<PurchaseConfirmation> {
    return this.http.post<PurchaseConfirmation>(`${this.baseUrl}/${purchaseId}/confirm`, {});
  }

  cancel(purchaseId: string): Observable<PurchaseView> {
    return this.http.post<PurchaseView>(`${this.baseUrl}/${purchaseId}/cancel`, {});
  }
}
