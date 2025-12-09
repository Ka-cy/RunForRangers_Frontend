import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRoleUpdateComponent } from './admin-role-update.component';

describe('AdminRoleUpdateComponent', () => {
  let component: AdminRoleUpdateComponent;
  let fixture: ComponentFixture<AdminRoleUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRoleUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminRoleUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
