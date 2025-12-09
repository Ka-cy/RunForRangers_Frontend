import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DynamicImageComponent } from './dynamic-image.component';
import { ImageService } from '../../API-Services/image.service';

describe('DynamicImageComponent', () => {
  let component: DynamicImageComponent;
  let fixture: ComponentFixture<DynamicImageComponent>;
  let mockImageService: jasmine.SpyObj<ImageService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ImageService', ['getProductImageUrl']);

    await TestBed.configureTestingModule({
      imports: [DynamicImageComponent],
      providers: [
        { provide: ImageService, useValue: spy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicImageComponent);
    component = fixture.componentInstance;
    mockImageService = TestBed.inject(ImageService) as jasmine.SpyObj<ImageService>;
    
    // Mock the service method
    mockImageService.getProductImageUrl.and.returnValue(of('test-image-url.jpg'));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getProductImageUrl on init', () => {
    component.ngOnInit();
    expect(mockImageService.getProductImageUrl).toHaveBeenCalled();
  });
});
