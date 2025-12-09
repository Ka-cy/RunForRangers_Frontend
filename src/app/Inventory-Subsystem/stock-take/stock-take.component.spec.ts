import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockTakeComponent } from './stock-take.component';

describe('StockTakeComponent', () => {
  let component: StockTakeComponent;
  let fixture: ComponentFixture<StockTakeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockTakeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockTakeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
