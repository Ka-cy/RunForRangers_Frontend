import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateExpenditureComponent } from './create-expenditure.component';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';

describe('CreateExpenditureComponent', () => {
  let component: CreateExpenditureComponent;
  let fixture: ComponentFixture<CreateExpenditureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateExpenditureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateExpenditureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
