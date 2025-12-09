import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminViewRunnerComponent } from './admin-view-runner.component';

describe('AdminViewRunnerComponent', () => {
  let component: AdminViewRunnerComponent;
  let fixture: ComponentFixture<AdminViewRunnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminViewRunnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminViewRunnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
