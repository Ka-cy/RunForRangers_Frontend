import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRunnerProfileComponent } from './edit-runner-profile.component';

describe('EditRunnerProfileComponent', () => {
  let component: EditRunnerProfileComponent;
  let fixture: ComponentFixture<EditRunnerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditRunnerProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditRunnerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
