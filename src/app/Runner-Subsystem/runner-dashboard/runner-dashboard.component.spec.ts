import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunnerDashboardComponent } from './runner-dashboard.component';

describe('RunnerDashboardComponent', () => {
  let component: RunnerDashboardComponent;
  let fixture: ComponentFixture<RunnerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunnerDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunnerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
