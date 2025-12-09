import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletedEventsComponent } from './completed-events.component';

describe('CompletedEventsComponent', () => {
  let component: CompletedEventsComponent;
  let fixture: ComponentFixture<CompletedEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletedEventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompletedEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
