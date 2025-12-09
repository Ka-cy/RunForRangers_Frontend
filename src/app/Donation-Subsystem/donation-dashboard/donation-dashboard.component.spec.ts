import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonationDashboardComponent } from './donation-dashboard.component';
import { Router } from '@angular/router';

describe('DonationDashboardComponent', () => {
  let component: DonationDashboardComponent;
  let fixture: ComponentFixture<DonationDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonationDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



       
    