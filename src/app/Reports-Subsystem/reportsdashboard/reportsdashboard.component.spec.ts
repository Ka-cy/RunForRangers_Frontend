import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsdashboardComponent } from './reportsdashboard.component';

describe('ReportsdashboardComponent', () => {
  let component: ReportsdashboardComponent;
  let fixture: ComponentFixture<ReportsdashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsdashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsdashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
