import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunnerNotificationsListComponent } from './runner-notifications-list.component';

describe('RunnerNotificationsListComponent', () => {
  let component: RunnerNotificationsListComponent;
  let fixture: ComponentFixture<RunnerNotificationsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunnerNotificationsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunnerNotificationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
