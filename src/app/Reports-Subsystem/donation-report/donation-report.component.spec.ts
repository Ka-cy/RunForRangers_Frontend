import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonationReportComponent } from './donation-report.component';

describe('DonationReportComponent', () => {
  let component: DonationReportComponent;
  let fixture: ComponentFixture<DonationReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonationReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonationReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
