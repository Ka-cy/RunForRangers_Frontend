import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiveStockComponent } from './receive-stock.component';

describe('ReceiveStockComponent', () => {
  let component: ReceiveStockComponent;
  let fixture: ComponentFixture<ReceiveStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiveStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiveStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
