import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenditureHomeComponent } from './expenditure-home.component';

describe('ExpenditureHomeComponent', () => {
  let component: ExpenditureHomeComponent;
  let fixture: ComponentFixture<ExpenditureHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExpenditureHomeComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenditureHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have 4 expenditures initially', () => {
    expect(component.expenditures.length).toBe(4);
  });

  it('should delete an expenditure and re-index IDs', () => {
    spyOn(window, 'confirm').and.returnValue(true); // Simulate confirmation

    const initialLength = component.expenditures.length;
    component.DeleteExpenditureById(2); // Delete ID 2

    expect(component.expenditures.length).toBe(initialLength - 1);
    expect(component.expenditures.find(e => e.expenditureId === 2)).toBeUndefined();
    expect(component.expenditures.map(e => e.expenditureId)).toEqual([1, 2, 3]); // IDs re-indexed
  });

  it('should not delete if confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false); // Cancel confirmation

    const initialLength = component.expenditures.length;
    component.DeleteExpenditureById(2);

    expect(component.expenditures.length).toBe(initialLength); // No change
  });

  it('should call editExpenditure and show alert', () => {
    spyOn(window, 'alert');
    const expenditure = component.expenditures[0];

    component.EditExpenditureById(expenditure);

    expect(window.alert).toHaveBeenCalledWith(`Edit Expenditure ID: ${expenditure.expenditureId}`);
  });
});
