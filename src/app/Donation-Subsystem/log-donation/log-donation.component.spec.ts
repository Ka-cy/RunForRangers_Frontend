import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LogDonationComponent } from './log-donation.component';

describe('LogDonationComponent', () => {
  let component: LogDonationComponent;
  let fixture: ComponentFixture<LogDonationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogDonationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogDonationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
