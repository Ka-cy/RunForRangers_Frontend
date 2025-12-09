import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateRunnerComponent } from './update-runner.component';

describe('UpdateRunnerComponent', () => {
  let component: UpdateRunnerComponent;
  let fixture: ComponentFixture<UpdateRunnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateRunnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateRunnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
