import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunnerDonationReportComponent } from './runner-donation-report.component';

describe('RunnerDonationReportComponent', () => {
  let component: RunnerDonationReportComponent;
  let fixture: ComponentFixture<RunnerDonationReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunnerDonationReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunnerDonationReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
