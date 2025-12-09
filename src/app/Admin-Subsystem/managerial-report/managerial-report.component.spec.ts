import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerialReportComponent } from './managerial-report.component';

describe('ManagerialReportComponent', () => {
  let component: ManagerialReportComponent;
  let fixture: ComponentFixture<ManagerialReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerialReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerialReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
