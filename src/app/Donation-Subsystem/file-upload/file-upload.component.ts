  import { Component, OnInit } from '@angular/core';
  import { Router } from '@angular/router';
  import * as XLSX from 'xlsx';
  import { DonationService } from '../../API-Services/donation.service';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';

  interface Runner {
    userId: number;
    name: string;
  }

  interface ApiResponse {
    successCount: number;
    errorCount: number;
    errors: string[];
  }

  interface ExcelRow {
    [key: string]: string | number;
  }

  @Component({
    selector: 'app-file-upload',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './file-upload.component.html',
    styleUrl: './file-upload.component.css'
  })
  export class FileUploadComponent implements OnInit {
    parsedData: ExcelRow[] = [];
    headers: string[] = [];
    processedData: any[] = [];
    validDonations: any[] = [];
    invalidDonations: any[] = [];
    unmatchedRunners: any[] = [];
    availableRunners: any[] = [];
    
    isProcessing: boolean = false;
    isUploading: boolean = false;

    columnMapping = {
      type: '',
      runnerName: '',
      donorName: '',
      amount: '',
      date: ''
    };

    constructor(
      private donationService: DonationService,
      private router: Router
    ) {}

    ngOnInit() {
      this.loadAvailableRunners();
    }

    loadAvailableRunners() {
      this.donationService.getRunners().subscribe({
        next: (runners: Array<{ userId: number; user: { firstName: string; surname: string } }>) => {
          this.availableRunners = runners.map(r => ({
            userId: r.userId,
            name: `${r.user.firstName ?? ''} ${r.user.surname ?? ''}`.trim()
          }));
          console.log('Loaded runners:', this.availableRunners);
        },
        error: (error: Error) => {
          console.error('Failed to load runners:', error);
          alert('Failed to load available runners. Please refresh the page.');
        }
      });
    }

    onFileChange(event: any) {
      const file = event.target.files[0];
      if (file) {
        this.reset();
        this.parseExcelFile(file);
      }
    }

    parseExcelFile(file: File) {
      this.isProcessing = true;
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
          
          if (jsonData.length > 0) {
            this.headers = jsonData[0] as string[];
            this.parsedData = jsonData.slice(1)
              .filter((row: (string | number)[]) => row && row.length > 0) // Filter out empty rows
              .map((row: (string | number)[]) => {
                const obj: ExcelRow = {};
                this.headers.forEach((header, index) => {
                  obj[header] = row[index] || '';
                });
                return obj;
              });
            
            console.log(`Parsed ${this.parsedData.length} rows from Excel file`);
          }
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          alert('Error parsing Excel file. Please ensure it\'s a valid Excel file.');
        } finally {
          this.isProcessing = false;
        }
      };
      
      reader.onerror = () => {
        this.isProcessing = false;
        alert('Error reading file. Please try again.');
      };
      
      reader.readAsArrayBuffer(file);
    }

    canProcess(): boolean {
      return !!(this.columnMapping.type && 
                this.columnMapping.donorName && 
                this.columnMapping.amount && 
                this.columnMapping.date &&
                this.parsedData.length > 0);
    }

    processAndPreview() {
      this.isProcessing = true;
      this.validDonations = [];
      this.invalidDonations = [];
      this.unmatchedRunners = [];

      setTimeout(() => {
        this.parsedData.forEach((row, index) => {
          const donation: {
            type: string;
            donorName: string;
            amount: number;
            date: Date | null;
            runnerName: string | null;
            userId: number | null;
            rowIndex: number;
          } = {
            type: this.normalizeType(row[this.columnMapping.type]?.toString() || ''),
            donorName: row[this.columnMapping.donorName]?.toString().trim(),
            amount: this.parseAmount(row[this.columnMapping.amount]),
            date: this.parseDate(row[this.columnMapping.date]),
            runnerName: this.columnMapping.runnerName ? 
                      row[this.columnMapping.runnerName]?.toString().trim() : null,
            userId: null,
            rowIndex: index + 2 // +2 for header row and 0-based index
          };

          // Validate basic fields
          const validationErrors = this.validateBasicFields(donation);
          if (validationErrors.length > 0) {
            this.invalidDonations.push({
              ...donation,
              error: validationErrors.join(', ')
            });
            return;
          }

          // Handle runner type donations
          if (donation.type === 'Runner') {
            if (!donation.runnerName) {
              this.invalidDonations.push({
                ...donation,
                error: 'Runner donations must specify a runner name'
              });
              return;
            }

            // Try to match runner
            const matchedRunner = this.findMatchingRunner(donation.runnerName);
            if (matchedRunner) {
              donation.userId = matchedRunner.userId;
              this.validDonations.push(donation);
            } else {
              // Add to unmatched for manual selection
              let existingUnmatched = this.unmatchedRunners.find(u => 
                donation.runnerName && u.excelName.toLowerCase() === donation.runnerName.toLowerCase()
              );
              
              if (!existingUnmatched) {
                existingUnmatched = {
                  excelName: donation.runnerName,
                  selectedUserId: null,
                  donations: []
                };
                this.unmatchedRunners.push(existingUnmatched);
              }
              existingUnmatched.donations.push(donation);
            }
          } else {
            // Organisation donation - assign to head admin (userId: 1)
            donation.userId = 1;
            this.validDonations.push(donation);
          }
        });

        this.processedData = [...this.validDonations, ...this.invalidDonations];
        this.isProcessing = false;
        
        console.log('Processing complete:', {
          valid: this.validDonations.length,
          invalid: this.invalidDonations.length,
          unmatched: this.unmatchedRunners.length
        });
      }, 100);
    }

    validateBasicFields(donation: any): string[] {
      const errors: string[] = [];
      
      if (!donation.type) errors.push('Missing donation type');
      if (!donation.donorName) errors.push('Missing donor name');
      if (!donation.amount || donation.amount <= 0) errors.push('Invalid amount');
      if (!donation.date) errors.push('Invalid date');
      if (donation.donorName && donation.donorName.length > 100) {
        errors.push('Donor name too long (max 100 characters)');
      }
      
      return errors;
    }

    normalizeType(type: string): string {
      if (!type) return '';
      const normalized = type.toString().toLowerCase().trim();
      if (normalized === 'runner' || normalized === 'r') return 'Runner';
      if (normalized === 'organisation' || normalized === 'organization' || normalized === 'org' || normalized === 'o') return 'Organisation';
      return type;
    }

    parseAmount(value: any): number {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Remove currency symbols and commas
        const cleaned = value.replace(/[,$£€¥]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    }

    findMatchingRunner(runnerName: string): any {
    // Add safety check for runnerName
    if (!runnerName || typeof runnerName !== 'string') {
      console.warn('Invalid runnerName provided to findMatchingRunner:', runnerName);
      return null;
    }
    
    const searchName = runnerName.toLowerCase().trim();
    
    return this.availableRunners.find(runner => {
      // Add safety checks for runner and runner.name
      if (!runner || !runner.name || typeof runner.name !== 'string') {
        console.warn('Invalid runner data found:', runner);
        return false;
      }
      
      const runnerNameLower = runner.name.toLowerCase().trim();
      
      // Exact match
      if (runnerNameLower === searchName) return true;
      
      // Fuzzy matching
      const nameParts = searchName.split(' ').filter((part: string) => part.length > 0);
      const runnerParts = runnerNameLower.split(' ').filter((part: string) => part.length > 0);
      
      // Check if all parts of search name exist in runner name
      return nameParts.length > 0 && nameParts.every((part: string) => 
        runnerParts.some((runnerPart: string) => runnerPart.includes(part) || part.includes(runnerPart))
      );
    });
  }

    parseDate(dateValue: any): Date | null {
      if (!dateValue) return null;
      
      // Handle Excel date numbers
      if (typeof dateValue === 'number') {
        return new Date((dateValue - 25569) * 86400 * 1000);
      }
      
      // Handle string dates
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    canUpload(): boolean {
      return this.validDonations.length > 0 && 
            this.unmatchedRunners.every(u => u.selectedUserId);
    }

    uploadDonations() {
      const currentAdminId = this.getCurrentAdminId();
      
      if (!currentAdminId) {
        alert('Unable to identify current admin. Please log in again.');
        this.router.navigate(['/login']);
        return;
      }

      console.log('Current Admin ID:', currentAdminId);
      console.log('Valid donations before processing:', this.validDonations.length);
      console.log('Unmatched runners:', this.unmatchedRunners.length);

      this.isUploading = true;

      // Create a copy of validDonations to avoid mutating the original array
      let donationsToUpload = [...this.validDonations];

      // Apply manual runner selections for unmatched runners
      this.unmatchedRunners.forEach(unmatched => {
        if (unmatched.selectedUserId) {
          console.log(`Applying manual selection: ${unmatched.excelName} -> User ID: ${unmatched.selectedUserId}`);
          unmatched.donations.forEach((donation: any) => {
            donation.userId = parseInt(unmatched.selectedUserId);
            donationsToUpload.push(donation);
          });
        } else {
          console.warn(`Unmatched runner "${unmatched.excelName}" has no selected user ID`);
        }
      });

      console.log('Total donations to upload:', donationsToUpload.length);

      // Transform for API - ensure proper date formatting and data structure
      const donationsForApi = donationsToUpload.map((d, index) => {
        // Handle date properly
        let formattedDate: string;
        if (d.date instanceof Date) {
          formattedDate = d.date.toISOString();
        } else if (typeof d.date === 'string') {
          formattedDate = new Date(d.date).toISOString();
        } else {
          console.warn(`Invalid date format for donation at index ${index}:`, d.date);
          formattedDate = new Date().toISOString(); // Fallback to current date
        }

        const apiDonation = {
          type: d.type,
          donorName: d.donorName,
          amount: parseFloat(d.amount.toString()),
          date: formattedDate,
          userId: d.type === 'Organisation' ? 1 : (d.userId ? parseInt(d.userId.toString()) : null)
        };

        console.log(`Donation ${index + 1}:`, apiDonation);
        return apiDonation;
      });

      // Validate the payload before sending
      const invalidDonations = donationsForApi.filter((donation, index) => {
        const errors = [];
        if (!donation.type || (donation.type !== 'Runner' && donation.type !== 'Organisation')) {
          errors.push(`Invalid type: ${donation.type}`);
        }
        if (!donation.donorName || donation.donorName.trim() === '') {
          errors.push('Missing donor name');
        }
        if (!donation.amount || donation.amount <= 0) {
          errors.push(`Invalid amount: ${donation.amount}`);
        }
        if (!donation.date || isNaN(new Date(donation.date).getTime())) {
          errors.push(`Invalid date: ${donation.date}`);
        }
        if (donation.type === 'Runner' && !donation.userId) {
          errors.push('Runner donations must have a userId');
        }
        if (donation.type === 'Organisation' && donation.userId !== 1) {
          errors.push('Organisation donations must be assigned to userId 1 (head admin)');
        }

        if (errors.length > 0) {
          console.error(`Validation failed for donation ${index + 1}:`, errors, donation);
          return true;
        }
        return false;
      });

      if (invalidDonations.length > 0) {
        console.error(`${invalidDonations.length} donations failed client-side validation`);
        this.isUploading = false;
        alert(`${invalidDonations.length} donations failed validation. Check the console for details.`);
        return;
      }

      const payload = {
        loggedByAdminId: currentAdminId,
        donations: donationsForApi
      };

      console.log('Final payload being sent to API:', payload);
      console.log('Payload JSON:', JSON.stringify(payload, null, 2));

      this.donationService.bulkUploadDonations(donationsForApi, currentAdminId).subscribe({
        next: (response: ApiResponse) => {
          console.log('Upload response received:', response);
          this.isUploading = false;
          
          let message = `Successfully uploaded ${response.successCount} donations!`;
          if (response.errorCount > 0) {
            message += `\n\n${response.errorCount} donations failed to upload:`;
            response.errors.forEach((error: string) => {
              message += `\n• ${error}`;
            });
            console.error('Server errors:', response.errors);
          }
          
          alert(message);
          
          if (response.successCount > 0) {
            this.reset();
          }
        },
        error: (error: any) => {
          console.error('Upload failed - Full error object:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error body:', error.error);
          
          this.isUploading = false;
          
          let errorMessage = 'Upload failed. ';
          if (error.error && error.error.message) {
            errorMessage += error.error.message;
          } else if (error.message) {
            errorMessage += error.message;
          } else {
            errorMessage += 'Unknown error occurred.';
          }
          
          alert(errorMessage + '\n\nCheck the console for detailed error information.');
        }
      });
    }

    // Add this temporary method to test with minimal data
    testUpload() {
      const currentAdminId = this.getCurrentAdminId();
      console.log('Testing with admin ID:', currentAdminId);

      const testDonation = [{
        type: 'Organisation',
        donorName: 'Test Donor',
        amount: 100.00,
        date: new Date().toISOString(),
        userId: 1  // Organisation donations go to head admin (userId: 1)
      }];

      console.log('Test payload:', { loggedByAdminId: currentAdminId, donations: testDonation });

      this.donationService.bulkUploadDonations(testDonation, currentAdminId).subscribe({
        next: (response) => {
          console.log('Test successful:', response);
          alert('Test upload successful!');
        },
        error: (error) => {
          console.error('Test failed:', error);
          alert('Test upload failed - check console');
        }
      });
    }

    getRunnerName(userId: number): string {
      const runner = this.availableRunners.find(r => r.userId === userId);
      return runner ? runner.name : '';
    }

    private getCurrentAdminId(): number {
      try {
        const adminData = sessionStorage.getItem('adminData');
        if (adminData) {
          const admin = JSON.parse(adminData);
          return admin.userId || admin.id || 0;
        }
        return 0;
      } catch (error) {
        console.error('Error parsing admin data from session storage:', error);
        return 0;
      }
    }

    downloadTemplate() {
      const templateData = [
        ['Type', 'Donor Name', 'Amount', 'Date', 'Runner Name'],
        ['Runner', 'John Doe', '50.00', '2024-01-15', 'Jane Smith'],
        ['Organisation', 'ABC Company', '100.00', '2024-01-16', ''],
        ['Runner', 'Mary Johnson', '25.50', '2024-01-17', 'Bob Wilson']
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Donation Template');
      
      XLSX.writeFile(wb, 'donation_template.xlsx');
    }

    reset() {
      this.parsedData = [];
      this.headers = [];
      this.processedData = [];
      this.validDonations = [];
      this.invalidDonations = [];
      this.unmatchedRunners = [];
      this.isProcessing = false;
      this.isUploading = false;
      
      this.columnMapping = {
        type: '',
        runnerName: '',
        donorName: '',
        amount: '',
        date: ''
      };
    }
  }