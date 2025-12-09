import { TestBed } from '@angular/core/testing';

import { DBResetService } from './dbreset.service';

describe('DBResetService', () => {
  let service: DBResetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DBResetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
