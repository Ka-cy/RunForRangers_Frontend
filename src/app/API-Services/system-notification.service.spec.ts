import { TestBed } from '@angular/core/testing';

import { SystemNotificationService } from './system-notification.service';

describe('SystemNotificationService', () => {
  let service: SystemNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
