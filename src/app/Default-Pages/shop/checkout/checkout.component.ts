import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartDto, CartItemDto } from '../../../API-Services/cart.service';
import { OrderService, CreateInitialOrderDto, InitialOrderResponseDto, SelectAddressDto, SelectBillingAddressDto, ProcessPaymentDto, CompleteCheckoutDto, CompleteCheckoutResponseDto } from '../../../API-Services/order.service';
import { UserAddressService, UserAddressDto, CreateUserAddressDto } from '../../../API-Services/user-address.service';
import { AuthService } from './auth-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CityService } from '../../../API-Services/city.service';
import { ChangeDetectorRef } from '@angular/core';


interface Province {
  provinceId: number;
  provinceName: string;
}

interface City {
  cityId: number;
  cityName: string;
  provinceId: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  currentStep = 1;
  maxCompletedStep = 0;
  userId: number | null = null;
  cartId: number | null = null;
  orderId: number | null = null;
  cart: CartDto | null = null;
  cartItems: CartItemDto[] = [];
  currentUser: any = null;
  error: string | null = null;
  isLoading: boolean = false;
  userAddresses: UserAddressDto[] = [];


  provinces: Province[] = [];
  cities: City[] = [];



  selectedShippingAddress: UserAddressDto | null = null;
  selectedBillingAddress: UserAddressDto | null = null;
  useSameAddressForBilling = true;
  showNewShippingForm = false;
  showNewBillingForm = false;
  saveShippingAddress = false;
  saveBillingAddress = false;
  subtotal = 0;
  deliveryFee = 50;
  taxRate = 0.15;
  total = 0;
  shippingForm: FormGroup;
  billingForm: FormGroup;
  paymentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private orderService: OrderService,
    private userAddressService: UserAddressService,
    private cityService: CityService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
      this.shippingForm = this.fb.group({
        streetAddress: ['', [Validators.required, Validators.maxLength(200), Validators.minLength(5)]],
        suburb: ['', [Validators.required, Validators.maxLength(100), Validators.minLength(2)]],
        postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
        provinceId: [0, [Validators.required, Validators.min(1)]],
        cityId: [0, [Validators.required, Validators.min(1)]]
      });

      this.billingForm = this.fb.group({
        streetAddress: ['', [Validators.required, Validators.maxLength(200), Validators.minLength(5)]],
        suburb: ['', [Validators.required, Validators.maxLength(100), Validators.minLength(2)]],
        postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
        provinceId: [0, [Validators.required, Validators.min(1)]],
        cityId: [0, [Validators.required, Validators.min(1)]]
      });

    this.paymentForm = this.fb.group({
      paymentMethod: ['Credit Card', Validators.required],
      cardholderName: ['', [Validators.required, Validators.maxLength(100)]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryMonth: [null, [Validators.required, Validators.min(1), Validators.max(12)]],
      expiryYear: [null, Validators.required],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]]
    });


    this.shippingForm.get('provinceId')?.valueChanges.subscribe(provinceId => {
    if (provinceId && provinceId > 0) { // Check for valid number
      this.loadCitiesForProvince(provinceId);
      this.shippingForm.get('cityId')?.setValue(0); // Reset to 0
    }
  });

    this.billingForm.get('provinceId')?.valueChanges.subscribe(provinceId => {
  if (provinceId && provinceId > 0) { // Check for valid number
    this.loadCitiesForProvince(provinceId);
    this.billingForm.get('cityId')?.setValue(0); // Reset to 0
  }
});
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || !this.currentUser.userId) {
      this.router.navigate(['/signIn']);
      return;
    }
    this.userId = this.currentUser.userId;

    this.loadProvinces();
    this.loadAllCities();

    // Read query params
    this.route.queryParams.subscribe(params => {
      this.orderId = +params['orderId'] || null;
      this.cartId = +params['cartId'] || null;
      this.userId = +params['userId'] || this.userId;
      this.loadInitialData();
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // method to load provinces
  private loadProvinces(): void {
    const provinceSub = this.cityService.getAllProvinces().subscribe({
      next: (provinces) => {
        this.provinces = provinces;
        console.log('Provinces loaded:', provinces);
      },
      error: (error) => {
        console.error('Error loading provinces:', error);
        this.error = 'Failed to load provinces. Please refresh the page.';
      }
    });
    this.subscriptions.push(provinceSub);
  }

    private loadAllCities(): void {
      const citySub = this.cityService.getAllCities().subscribe({
        next: (cities) => {
          this.cities = cities.map((city: any) => ({
            cityId: city.cityId,
            cityName: city.cityName,
            provinceId: city.provinceID
          }));
          console.log('Cities loaded:', this.cities);
        },
        error: (error) => {
          console.error('Error loading cities:', error);
          this.error = 'Failed to load cities. Please refresh the page.';
        }
      });
      this.subscriptions.push(citySub);
    }

       private loadCitiesForProvince(provinceId: number): void {
      const citySub = this.cityService.getCitiesByProvince(provinceId).subscribe({
        next: (cities) => {
          // Update cities for the specific province only
          const transformedCities = cities.map(city => ({
            cityId: city.cityId,
            cityName: city.cityName,
            provinceId: provinceId
          }));

          // Replace cities for this province
          this.cities = [
            ...this.cities.filter(c => c.provinceId !== provinceId),
            ...transformedCities
          ];

          console.log(`Cities loaded for province ${provinceId}:`, this.cities);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`Error loading cities for province ${provinceId}:`, error);
          this.error = `Failed to load cities for the selected province`;
        }
      });
      this.subscriptions.push(citySub);
    }

  // Get cities filtered by selected province
    getFilteredCities(formType: 'shipping' | 'billing' = 'shipping'): City[] {
      let provinceId: number;

      if (formType === 'shipping') {
        provinceId = this.shippingForm.get('provinceId')?.value;
      } else {
        provinceId = this.billingForm.get('provinceId')?.value;
      }

      if (!provinceId) return [];

      return this.cities.filter(city => city.provinceId === provinceId);
    }

  private loadInitialData() {
    this.isLoading = true;
    this.error = null;

    if (!this.userId || !this.cartId || !this.orderId) {
      this.error = 'Missing required checkout parameters.';
      this.isLoading = false;
      this.router.navigate(['/cart']);
      return;
    }

    const cartSub = this.cartService.getCart(this.userId).subscribe({
      next: (cart) => {
        this.cart = cart;
        this.cartItems = cart.cartItems || [];
        this.subtotal = this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        this.total = this.subtotal + this.deliveryFee + this.getTaxAmount();
        this.loadUserAddresses();
      },
      error: (err) => {
        this.error = 'Failed to load cart. Please try again.';
        this.isLoading = false;
      }
    });

    this.subscriptions.push(cartSub);
  }

  private loadUserAddresses() {
    this.userAddressService.getUserAddresses(this.userId!).subscribe({
      next: (addresses) => {
        this.userAddresses = addresses;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load addresses. Please try again.';
        this.isLoading = false;
      }
    });
  }

  selectShippingAddress(address: UserAddressDto) {
    this.selectedShippingAddress = address;
    this.showNewShippingForm = false;
    if (this.useSameAddressForBilling) {
      this.selectedBillingAddress = address;
    }
  }

  selectBillingAddress(address: UserAddressDto) {
    this.selectedBillingAddress = address;
    this.showNewBillingForm = false;
  }

  toggleNewShippingForm() {
    this.showNewShippingForm = !this.showNewShippingForm;
    this.selectedShippingAddress = null;
    this.shippingForm.reset();
  }

  toggleNewBillingForm() {
    this.showNewBillingForm = !this.showNewBillingForm;
    this.selectedBillingAddress = null;
    this.billingForm.reset();
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (this.cartItems.length === 0) {
        this.error = 'Cart is empty. Please add items to proceed.';
        return;
      }
      this.currentStep = 2;
      this.maxCompletedStep = Math.max(this.maxCompletedStep, 1);
    } else if (this.currentStep === 2) {
      if (!this.selectedShippingAddress && this.shippingForm.invalid) {
        this.markFormGroupTouched(this.shippingForm);
        return;
      }
      this.handleShippingAddress().then(() => {
        this.currentStep = 3;
        this.maxCompletedStep = Math.max(this.maxCompletedStep, 2);
      }).catch(err => {
        this.error = 'Failed to process shipping address. Please try again.';
      });
    } else if (this.currentStep === 3) {
      if (!this.useSameAddressForBilling && !this.selectedBillingAddress && this.billingForm.invalid) {
        this.markFormGroupTouched(this.billingForm);
        return;
      }
      this.handleBillingAddress().then(() => {
        this.currentStep = 4;
        this.maxCompletedStep = Math.max(this.maxCompletedStep, 3);
      }).catch(err => {
        this.error = 'Failed to process billing address. Please try again.';
      });
    } else if (this.currentStep === 4) {
      if (this.paymentForm.invalid && this.paymentForm.get('paymentMethod')?.value !== 'EFT') {
        this.markFormGroupTouched(this.paymentForm);
        return;
      }
      this.processPayment();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private async handleShippingAddress() {
  console.log('=== DEBUGGING SHIPPING ADDRESS ===');
  console.log('selectedShippingAddress:', this.selectedShippingAddress);
  console.log('showNewShippingForm:', this.showNewShippingForm);
  console.log('shippingForm valid:', this.shippingForm.valid);
  console.log('shippingForm value:', this.shippingForm.value);

  if (this.selectedShippingAddress) {
    const selectAddressDto: SelectAddressDto = {
      useExistingAddress: true,
      userAddressId: this.selectedShippingAddress.userAddressId,
      cityId: this.selectedShippingAddress.cityId,
      provinceId: this.selectedShippingAddress.provinceId
    };
    console.log('Using existing address:', selectAddressDto);
    await this.orderService.selectShippingAddress(this.orderId!, selectAddressDto).toPromise();
  } else if (this.showNewShippingForm && this.shippingForm.valid) {
    const formValue = this.shippingForm.value;

    // Validate values
    const cityId = Number(formValue.cityId);
    const provinceId = Number(formValue.provinceId);

    if (!formValue.streetAddress?.trim()) {
      throw new Error('Street address is required');
    }
    if (!formValue.suburb?.trim()) {
      throw new Error('Suburb is required');
    }
    if (!formValue.postalCode?.trim()) {
      throw new Error('Postal code is required');
    }
    if (!cityId || cityId <= 0) {
      throw new Error('Please select a valid city');
    }
    if (!provinceId || provinceId <= 0) {
      throw new Error('Please select a valid province');
    }

    // Verify city belongs to province
    const selectedCity = this.cities.find(c => c.cityId === cityId);
    if (!selectedCity) {
      throw new Error(`City with ID ${cityId} not found`);
    }
    if (selectedCity.provinceId !== provinceId) {
      throw new Error(`Selected city does not belong to the selected province`);
    }

    // DTO for creating new address
    const newAddressDto: CreateUserAddressDto = {
      streetAddress: formValue.streetAddress.trim(),
      suburb: formValue.suburb.trim(),
      postalCode: formValue.postalCode.trim(),
      cityId: cityId,                    // Ensure it's a number
      provinceId: provinceId,            // Ensure it's a number
      isDefault: Boolean(this.saveShippingAddress) // Ensure it's a boolean
    };

    console.log('Creating new address with DTO:', newAddressDto);
    console.log('DTO types check:');
    console.log('- streetAddress type:', typeof newAddressDto.streetAddress, 'length:', newAddressDto.streetAddress.length);
    console.log('- suburb type:', typeof newAddressDto.suburb, 'length:', newAddressDto.suburb.length);
    console.log('- postalCode type:', typeof newAddressDto.postalCode, 'valid format:', /^\d{4}$/.test(newAddressDto.postalCode));
    console.log('- cityId type:', typeof newAddressDto.cityId, 'value:', newAddressDto.cityId);
    console.log('- provinceId type:', typeof newAddressDto.provinceId, 'value:', newAddressDto.provinceId);
    console.log('- isDefault type:', typeof newAddressDto.isDefault, 'value:', newAddressDto.isDefault);

    try {
      // Make the API call
      const savedAddress = await this.userAddressService.createUserAddress(this.userId!, newAddressDto).toPromise();
      console.log('Address created successfully:', savedAddress);

      if (!savedAddress) {
        throw new Error('Failed to create address - no response received');
      }

      // Select the newly created address
      const selectAddressDto: SelectAddressDto = {
        useExistingAddress: true,
        userAddressId: savedAddress.userAddressId,
        cityId: savedAddress.cityId,
        provinceId: savedAddress.provinceId
      };

      console.log('Selecting newly created address:', selectAddressDto);
      await this.orderService.selectShippingAddress(this.orderId!, selectAddressDto).toPromise();

      this.userAddresses.push(savedAddress);
      this.selectedShippingAddress = savedAddress;
      console.log('Address selection completed successfully');

    } catch (error: any) {
      console.error('Error creating/selecting address:', error);

      // Log HTTP error details
      if (error.error) {
        console.error('HTTP Error Response:', error.error);
        if (error.error.message) {
          console.error('Error Message:', error.error.message);
        }
        if (error.error.errors) {
          console.error('Validation Errors:', error.error.errors);
        }
      }

      //user-friendly error message
      let errorMessage = 'Address creation failed';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors) {
        // Handle validation errors
        const validationErrors = Object.values(error.error.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  } else {
    console.error('No valid address selection method');
    console.error('selectedShippingAddress:', this.selectedShippingAddress);
    console.error('showNewShippingForm:', this.showNewShippingForm);
    console.error('shippingForm.valid:', this.shippingForm.valid);
    throw new Error('Please select an existing address or fill in the new address form correctly');
  }

  console.log('=== END DEBUGGING ===');
}


  private async handleBillingAddress() {
  if (this.useSameAddressForBilling && this.selectedShippingAddress) {
    const selectBillingDto: SelectBillingAddressDto = {
      useSameAsShipping: true
    };
    await this.orderService.selectBillingAddress(this.orderId!, selectBillingDto).toPromise();
    this.selectedBillingAddress = this.selectedShippingAddress;
  } else if (this.selectedBillingAddress) {
    const selectBillingDto: SelectBillingAddressDto = {
      useSameAsShipping: false,
      userAddressId: this.selectedBillingAddress.userAddressId
    };
    await this.orderService.selectBillingAddress(this.orderId!, selectBillingDto).toPromise();
  } else if (this.showNewBillingForm && this.billingForm.valid) {
    const formValue = this.billingForm.value;
    const newAddressDto: CreateUserAddressDto = {
      streetAddress: formValue.streetAddress,
      suburb: formValue.suburb,
      postalCode: formValue.postalCode,
      cityId: formValue.cityId,
      provinceId: formValue.provinceId,
      isDefault: this.saveBillingAddress
    };

    // Add null check and type assertion
    const savedAddress = await this.userAddressService.createUserAddress(this.userId!, newAddressDto).toPromise();
    if (!savedAddress) {
      throw new Error('Failed to create address');
    }

    const selectBillingDto: SelectBillingAddressDto = {
      useSameAsShipping: false,
      userAddressId: savedAddress.userAddressId
    };

    await this.orderService.selectBillingAddress(this.orderId!, selectBillingDto).toPromise();
    this.userAddresses.push(savedAddress);
    this.selectedBillingAddress = savedAddress;
  }
}

    private async processPayment() {
    this.isLoading = true;
    this.error = null;

    try {
      if (!this.orderId) {
        this.error = 'Order ID is missing. Please start the checkout process again.';
        this.isLoading = false;
        return;
      }

      const paymentMethod = this.paymentForm.get('paymentMethod')?.value;
      if (!paymentMethod) {
        this.error = 'Payment method is required.';
        this.isLoading = false;
        return;
      }

      // Prepare billing details based on payment method
      let billingDetailsStr: string;
      
      if (paymentMethod === 'EFT') {
        billingDetailsStr = 'EFT Payment';
      } else {
        // For credit/debit card payments, validate required fields
        const cardholderName = this.paymentForm.get('cardholderName')?.value;
        const cardNumber = this.paymentForm.get('cardNumber')?.value;
        const expiryMonth = this.paymentForm.get('expiryMonth')?.value;
        const expiryYear = this.paymentForm.get('expiryYear')?.value;
        const cvv = this.paymentForm.get('cvv')?.value;

        if (!cardholderName || !cardNumber || !cvv || !expiryMonth || !expiryYear) {
          this.error = 'All card details are required for non-EFT payments.';
          this.isLoading = false;
          return;
        }

        const billingDetailsObj = {
          cardholderName: cardholderName,
          cardNumber: cardNumber,
          expiryMonth: expiryMonth,
          expiryYear: expiryYear,
          cvv: cvv
        };
        billingDetailsStr = JSON.stringify(billingDetailsObj);
      }

      // Create the payment DTO
      const paymentDto = {
        paymentMethod: paymentMethod,
        billingDetails: billingDetailsStr,
        paymentReference: this.orderId?.toString() || `REF-${Date.now()}`
      };

      console.log('Processing payment with DTO:', paymentDto);

      // Process the payment using the existing order
      await this.orderService.processPayment(this.orderId, paymentDto).toPromise();

      // Clear the cart after successful payment
      await this.cartService.clearCart(this.cartId!).toPromise();
      localStorage.removeItem(`cart_user_${this.userId}`);
      
      // Navigate to success page
      this.router.navigate(['/order-success'], { 
        queryParams: { orderId: this.orderId } 
      });

    } catch (err: any) {
      console.error('Process payment error:', err);
      
      // Handle specific validation errors
      if (err.error?.errors) {
        const validationErrors = Object.entries(err.error.errors)
          .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        this.error = `Validation errors:\n${validationErrors}`;
      } else if (err.error?.title) {
        this.error = `${err.error.title}: ${err.error.detail || 'Please check your input and try again.'}`;
      } else if (err.error?.message) {
        this.error = err.error.message;
      } else {
        this.error = 'Failed to process payment. Please try again.';
      }
      
      this.isLoading = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  getTaxAmount(): number {
    return this.subtotal * this.taxRate;
  }

  getYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear + i);
    }
    return years;
  }


  getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'This field is required';
    }

    switch (fieldName) {
      case 'streetAddress':
        return control.hasError('minlength') ? 'Address must be at least 5 characters' : '';

      case 'postalCode':
        return control.hasError('pattern') ? 'Invalid postal code format' : '';

      case 'cardNumber':
        return control.hasError('pattern') ? 'Invalid card number' : '';

      case 'cvv':
        return control.hasError('pattern') ? 'Invalid CVV' : '';

      case 'cardholderName':
        return control.hasError('pattern') ? 'Invalid cardholder name' : '';

      default:
        return '';
    }
  }


  public navigateToCart() {
    this.router.navigate(['/cart']);
  }

  public navigateToHome() {
    this.router.navigate(['/home']);
  }

  public navigateToCheckout() {
    this.router.navigate(['/checkout']);
  }

  public navigateToShop(): void {
    this.router.navigate(['/shop']);
  }

}
