import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunnerMilestoneComponent } from './runner-milestone.component';

describe('RunnerMilestoneComponent', () => {
  let component: RunnerMilestoneComponent;
  let fixture: ComponentFixture<RunnerMilestoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunnerMilestoneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunnerMilestoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
