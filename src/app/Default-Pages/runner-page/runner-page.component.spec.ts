import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunnerPageComponent } from './runner-page.component';

describe('RunnerPageComponent', () => {
  let component: RunnerPageComponent;
  let fixture: ComponentFixture<RunnerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunnerPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunnerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
