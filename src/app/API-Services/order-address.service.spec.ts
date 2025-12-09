import { TestBed } from '@angular/core/testing';

import { OrderAddressService } from './order-address.service';

describe('OrderAddressService', () => {
  let service: OrderAddressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderAddressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
