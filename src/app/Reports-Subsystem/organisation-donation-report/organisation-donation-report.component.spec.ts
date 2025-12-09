import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganisationDonationReportComponent } from './organisation-donation-report.component';

describe('OrganisationDonationReportComponent', () => {
  let component: OrganisationDonationReportComponent;
  let fixture: ComponentFixture<OrganisationDonationReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganisationDonationReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganisationDonationReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
