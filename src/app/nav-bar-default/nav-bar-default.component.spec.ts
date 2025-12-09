import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavBarDefaultComponent } from './nav-bar-default.component';

describe('NavBarDefaultComponent', () => {
  let component: NavBarDefaultComponent;
  let fixture: ComponentFixture<NavBarDefaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavBarDefaultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavBarDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
