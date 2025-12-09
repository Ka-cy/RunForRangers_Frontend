import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureTimerOtpComponent } from './configure-timer-otp.component';

describe('ConfigureTimerOtpComponent', () => {
  let component: ConfigureTimerOtpComponent;
  let fixture: ComponentFixture<ConfigureTimerOtpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigureTimerOtpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigureTimerOtpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
