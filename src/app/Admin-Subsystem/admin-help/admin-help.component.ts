import { Component } from '@angular/core';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { FaqItem } from '../../Interfaces/FaqItem';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-help',
  imports: [NavBarAdminComponent, CommonModule, FormsModule],
  templateUrl: './admin-help.component.html',
  styleUrl: './admin-help.component.css'
})
export class AdminHelpComponent {
  searchQuery: string = '';
  selectedCategory: string = 'all';
  isSearching: boolean = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const categoryFromUrl = params['category'];
      if (categoryFromUrl && this.categories.some(c => c.value === categoryFromUrl)) {
        this.selectedCategory = categoryFromUrl;
      } else {
        this.selectedCategory = 'all';
      }
      console.log('Help page loaded with category:', this.selectedCategory);
    });
  }

  allFaqItems: FaqItem[] = [
    // Account & Admin Management
    {
      question: "What do the Different Admin accounts mean?",
      answer: "There are two admin accounts:\n• Head Admin: Is an admin with full access to the system\n• Junior Admin: Is a normal admin account with restricted access set by head admins upon creation and/or by editing the normal admin's access role",
      isOpen: false,
      category: "account",
      keywords: ["account", "access", "head admin", "junior admin", "permissions"]
    },
    {
      question: "How to Create an admin? (Head Admin Restricted)",
      answer: "1. Click on the Management tab\n2. Click on the Create Button\n3. Fill in the new Admin details\n4. Click on the Create Admin button",
      isOpen: false,
      category: "account",
      keywords: ["create", "admin", "management", "head admin", "restricted"]
    },
    {
      question: "How do I change my password?",
      answer: "1. Click Profile tab\n2. Scroll down to Passwords inputs\n3. Enter your Password\n4. Re-input your password to confirm your password\n5. Click the save button",
      isOpen: false,
      category: "account",
      keywords: ["password", "change", "profile", "security"]
    },
    {
      question: "How do I update my profile information?",
      answer: "1. Log into your account\n2. Navigate to 'Profile Settings'\n3. Edit the information you want to change\n4. Click 'Save Changes' to update your profile",
      isOpen: false,
      category: "account",
      keywords: ["profile", "update", "edit", "information", "settings"]
    },
    {
      question: "How do I manage admin role permissions? (Head Admin Restricted)",
      answer: "1. Go to the Management section\n2. Select the user you want to modify\n3. Click 'Edit Permissions'\n4. Adjust the permission settings as needed\n5. Save the changes",
      isOpen: false,
      category: "account",
      keywords: ["permissions", "admin", "manage", "edit", "access", "head admin", "restricted"]
    },

    // Employee Management
    {
      question: "How do I create an employee?",
      answer: "1. Go to the Employee Management tab in the admin dashboard\n2. Click on the Create Employee button\n3. Fill in the employee details (e.g., name, role, contact info)\n4. Click Save to add the new employee to the system",
      isOpen: false,
      category: "employees",
      keywords: ["employee", "create", "management", "dashboard"]
    },
    {
      question: "How do I update Employee information?",
      answer: "1. Navigate to the Employee Management tab\n2. Use the search bar or employee list to find the employee\n3. Click the Edit button next to their record\n4. Update the required details\n5. Click Save Changes to confirm",
      isOpen: false,
      category: "employees",
      keywords: ["employee", "update", "edit", "information", "management"]
    },
    {
      question: "How do I delete an Employee?",
      answer: "1. Navigate to the Employee Management tab\n2. Search or scroll to the employee you want to remove\n3. Click the Delete button next to their name\n4. Confirm the deletion when prompted",
      isOpen: false,
      category: "employees",
      keywords: ["employee", "delete", "remove", "management"]
    },
    {
      question: "How do I search for an Employee?",
      answer: "1. Go to the Employee Management tab\n2. Use the Search bar at the top of the list\n3. Type the employee's name or ID\n4. The results will filter automatically to match your search",
      isOpen: false,
      category: "employees",
      keywords: ["employee", "search", "find", "management", "filter"]
    },

    // Runner Management
    {
      question: "How do I search for a Runner?",
      answer: "1. Navigate to the Runner Management tab\n2. Enter the runner's name or ID in the Search bar\n3. The system will display matching results instantly",
      isOpen: false,
      category: "runners",
      keywords: ["runner", "search", "find", "management"]
    },
    {
      question: "How do I view Runner details?",
      answer: "1. Navigate to the Runner Management tab\n2. Find the runner using search, filter, or scroll\n3. Click on the runner's name or the View Details button\n4. The runner's profile and donation progress will be displayed",
      isOpen: false,
      category: "runners",
      keywords: ["runner", "view", "details", "profile", "progress"]
    },
    {
      question: "How do I update a Runner's milestone?",
      answer: "1. Navigate to the Runner Management tab\n2. Click Update Milestone button you'll be redirected to the update milestone page\n3. Enter the new milestone value\n4. Click Save to update their progress towards a new milestone",
      isOpen: false,
      category: "runners",
      keywords: ["runner", "milestone", "update", "progress"]
    },
    {
      question: "How do I delete a Runner?",
      answer: "1. Go to the Runner Management tab\n2. Find the runner using search, filter, or sort\n3. Click the Delete button next to their record\n4. Confirm the deletion when prompted",
      isOpen: false,
      category: "runners",
      keywords: ["runner", "delete", "remove", "management"]
    },
    {
      question: "How do I sort and filter Runners?",
      answer: "1. Navigate to the Runner Management tab\n2. Use the Filter options (By milestone progress, status, or Name)\n3. Use the Sort dropdown (sort by name, highest milestone, or newest registered)\n4. The runner list will update automatically according to your selection",
      isOpen: false,
      category: "runners",
      keywords: ["runner", "sort", "filter", "management", "milestone", "progress"]
    },

    // Product Management
    {
      question: "How do I create a product?",
      answer: "1. Navigate to the products page\n2. Select 'Add product'\n3. Place a photo of your selected product\n4. Enter the name of the product\n5. Enter the description of the product\n6. Select a size type and available sizes for your product\n7. Select the available colors for your product\n8. Assign the product to a category and type\n9. Save the new product you have created",
      isOpen: false,
      category: "products",
      keywords: ["product", "create", "add", "photo", "description", "size", "color", "category"]
    },
    {
      question: "How do I search for a product?",
      answer: "1. Navigate to the products page\n2. Enter the name of the product you would like to search in the search bar",
      isOpen: false,
      category: "products",
      keywords: ["product", "search", "find", "name"]
    },
    {
      question: "How do I edit a product?",
      answer: "1. Navigate to the products page\n2. Select the edit icon under the action column for the desired product\n3. Make changes to the data you wish to update\n4. Save changes",
      isOpen: false,
      category: "products",
      keywords: ["product", "edit", "update", "changes", "modify"]
    },
    {
      question: "How do I delete a product?",
      answer: "1. Navigate to the products page\n2. Select the delete icon on the product you wish to delete\n3. Confirm the deletion of the product",
      isOpen: false,
      category: "products",
      keywords: ["product", "delete", "remove", "confirm"]
    },

    // Event Management
    {
      question: "How do I create an event?",
      answer: "1. Navigate to the Events page\n2. Select 'Create New Event'\n3. Enter the name of the event\n4. Select the Show in user calendar checkbox (Checking this box ensures that the event is public and can be seen by all other users who navigate to the website)\n5. Enter the event description\n6. Select the date of the event\n7. Select the save button",
      isOpen: false,
      category: "events",
      keywords: ["event", "create", "new", "calendar", "public", "description", "date"]
    },
    {
      question: "How do I create a job for an event?",
      answer: "1. If the event does not already exist, create an event first\n2. Select the 'Assign job' button in the top right corner\n3. Enter the title of the job\n4. Enter the description of the job\n5. Click the 'Assign employees' button (Optional)\n6. Select one or numerous employees to assign to the job (Click and hold ALT when selecting multiple employees)\n7. Select Save button",
      isOpen: false,
      category: "events",
      keywords: ["event", "job", "assign", "employee", "title", "description", "multiple"]
    },
    {
      question: "How do I search for an event?",
      answer: "1. Navigate to the events page\n2. Enter the name of the event you would like to search in the search bar",
      isOpen: false,
      category: "events",
      keywords: ["event", "search", "find", "name"]
    },
    {
      question: "How do I edit an event?",
      answer: "1. Navigate to the events page\n2. Select the 'More info' button in the container for the event you wish to edit\n3. Make changes to the data you wish to update (including jobs and assigned employees)\n4. Select the save button",
      isOpen: false,
      category: "events",
      keywords: ["event", "edit", "update", "jobs", "employees", "modify"]
    },
    {
      question: "How do I mark an event as complete?",
      answer: "1. Navigate to the events page\n2. Select the 'Mark as complete' button in the container for the event you wish to edit\n3. Select 'Mark as Complete' in the confirmation dialogue box",
      isOpen: false,
      category: "events",
      keywords: ["event", "complete", "mark", "finish", "confirmation"]
    },
    {
      question: "How do I view runners registered for an event?",
      answer: "1. Navigate to the events page\n2. Select the 'View Registered Runners' button in the container for the salient event",
      isOpen: false,
      category: "events",
      keywords: ["event", "runners", "registered", "view", "participants"]
    },
    {
      question: "How do I delete an event?",
      answer: "1. Navigate to the events page\n2. Select the 'delete' button in the container for the event you wish to delete\n3. Confirm the deletion of the event in the confirmation dialogue box",
      isOpen: false,
      category: "events",
      keywords: ["event", "delete", "remove", "confirmation"]
    },

    // Expenditure Management
    {
      question: "How do I create an Expenditure?",
      answer: "1. Navigate to the Expenditure page\n2. Select 'Create New Expenditure'\n3. Enter the purpose of the Expenditure\n4. Enter the Expenditure description\n5. Enter the Expenditure amount\n6. Select the date of the Expenditure\n7. Provide Expenditure receipt (Image or PDF)\n8. Select the save button",
      isOpen: false,
      category: "expenditure",
      keywords: ["expenditure", "create", "purpose", "description", "amount", "date", "receipt"]
    },
    {
      question: "How do I search for an Expenditure?",
      answer: "1. Navigate to the expenditure page\n2. Enter the purpose of the Expenditure you would like to search in the search bar",
      isOpen: false,
      category: "expenditure",
      keywords: ["expenditure", "search", "purpose", "find"]
    },
    {
      question: "How do I edit an Expenditure?",
      answer: "1. Navigate to the expenditure page\n2. Select the 'Edit' button in the table for the expenditure you wish to edit\n3. Make changes to the data you wish to update\n4. Select the save button",
      isOpen: false,
      category: "expenditure",
      keywords: ["expenditure", "edit", "update", "modify", "changes"]
    },
    {
      question: "How do I delete an Expenditure?",
      answer: "1. Navigate to the expenditure page\n2. Select the 'delete' button in the table for the expenditure you wish to delete\n3. Confirm the deletion of the expenditure in the confirmation dialogue box",
      isOpen: false,
      category: "expenditure",
      keywords: ["expenditure", "delete", "remove", "confirmation"]
    },

    // Donation Management
    {
      question: "How do I filter donation by their type?",
      answer: "1. Select either runner or organization button on the filter by tab on the donations page",
      isOpen: false,
      category: "donations",
      keywords: ["donation", "filter", "type", "runner", "organization"]
    },
    {
      question: "How do I search a donation?",
      answer: "1. Click on the search bar on the top left of the donations page\n2. Enter the term you want to search for, and the relevant donations will display",
      isOpen: false,
      category: "donations",
      keywords: ["donation", "search", "find", "term"]
    },
    {
      question: "How do I delete a donation?",
      answer: "1. Select the 'Delete' button on the action column of the donations table\n2. Confirm that you want to delete the specific donation you selected",
      isOpen: false,
      category: "donations",
      keywords: ["donation", "delete", "remove", "confirmation"]
    },
    {
      question: "How do I edit a donation?",
      answer: "1. Select the 'Edit' button located on the action column of the donation table in the same row as the donation you wish to edit\n2. An edit donation screen will be displayed\n3. Enter the new donation details and select 'save'\n4. The donation will be updated",
      isOpen: false,
      category: "donations",
      keywords: ["donation", "edit", "update", "details", "modify"]
    },
    {
      question: "How do I log a donation?",
      answer: "1. Select the 'log donation' button located on the donation screen\n2. A screen will display with a form for you to enter the donations details such as donor and amount\n3. You can also select on the form the specific donation type, runner or organisation. If you are logging a donation for a runner, you can select runner donation and then select a specific runner that is currently on the system\n4. After entering the donations details on the form, select 'Save'\n5. The new donation will be saved on the system",
      isOpen: false,
      category: "donations",
      keywords: ["donation", "log", "create", "donor", "amount", "runner", "organization"]
    },
    {
      question: "How do I log multiple donations at once with Excel?",
      answer: "1. On the donations page select the 'Bulk upload donations' button on the top right\n2. You will be redirected to the file upload section, here you can download an excel template for recording multiple donations\n3. If you already have an excel file you wish to upload, select the 'Choose excel file' button\n4. After selecting your excel file, you will be prompted to assign the columns in your excel file with the data that the system expects\n5. After assigning all your columns in excel with the relevant fields, select the 'process data' button\n6. The system will then show you what donations have the correct information for saving (valid donations)\n7. When ready to save the current valid donations to the database select the 'upload' button",
      isOpen: false,
      category: "donations",
      keywords: ["donation", "bulk", "excel", "upload", "multiple", "template", "columns", "valid"]
    },

    // Orders & Reports
    {
      question: "How do I download an order report?",
      answer: "1. Click on the 'Order report' button on the order screen",
      isOpen: false,
      category: "orders",
      keywords: ["order", "report", "download", "export"]
    },
    {
      question: "How do I change an orders status?",
      answer: "1. On the order screen, click on the dropdown on the order status column\n2. Select the new order status",
      isOpen: false,
      category: "orders",
      keywords: ["order", "status", "change", "update", "dropdown"]
    }
  ];

  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'account', label: 'Account & Admin' },
    { value: 'employees', label: 'Employees' },
    { value: 'runners', label: 'Runners' },
    { value: 'products', label: 'Products' },
    { value: 'events', label: 'Events' },
    { value: 'expenditure', label: 'Expenditure' },
    { value: 'donations', label: 'Donations' },
    { value: 'orders', label: 'Orders' },
    { value: 'reports', label: 'Reports' }
  ];

  get filteredFaqItems(): FaqItem[] {
    let filtered = this.allFaqItems;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const questionMatch = item.question.toLowerCase().includes(query);
        const answerMatch = item.answer.toLowerCase().includes(query);
        const keywordMatch = item.keywords?.some(keyword =>
          keyword.toLowerCase().includes(query)
        );
        return questionMatch || answerMatch || keywordMatch;
      });
    }

    // Sort by relevance (exact matches first, then partial matches)
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered.sort((a, b) => {
        const aExactMatch = a.question.toLowerCase().includes(query) ||
                           a.keywords?.some(k => k.toLowerCase() === query);
        const bExactMatch = b.question.toLowerCase().includes(query) ||
                           b.keywords?.some(k => k.toLowerCase() === query);

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        return 0;
      });
    }

    return filtered;
  }

  get hasResults(): boolean {
    return this.filteredFaqItems.length > 0;
  }

  get searchResultText(): string {
    const count = this.filteredFaqItems.length;
    const total = this.allFaqItems.length;

    if (this.searchQuery.trim() || this.selectedCategory !== 'all') {
      return `Showing ${count} of ${total} questions`;
    }
    return `${total} questions available`;
  }

  onSearchChange(): void {
    this.closeAllAnswers();
  }

  onSearchSubmit(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.isSearching = true;
    this.closeAllAnswers();

    setTimeout(() => {
      this.isSearching = false;
      console.log('Search performed:', this.searchQuery);
      if (this.hasResults) {
        this.scrollToResults();
      }
    }, 300);
  }

  onCategoryChange(): void {
    this.closeAllAnswers();
    console.log('Category changed to:', this.selectedCategory);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.isSearching = false;
    this.closeAllAnswers();
    console.log('Search and filters cleared');
  }

  toggleAnswer(index: number): void {
    const actualItem = this.filteredFaqItems[index];
    this.allFaqItems.forEach(item => {
      if (item !== actualItem) {
        item.isOpen = false;
      }
    });
    actualItem.isOpen = !actualItem.isOpen;
    console.log('FAQ item toggled:', actualItem.question);
  }

  closeAllAnswers(): void {
    this.allFaqItems.forEach(item => {
      item.isOpen = false;
    });
  }

  formatAnswer(answer: string): string {
    return answer.replace(/\n/g, '<br>');
  }

  highlightSearchTerm(text: string): string {
    if (!this.searchQuery.trim()) return text;
    const query = this.searchQuery.trim();
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private scrollToResults(): void {
    const faqContainer = document.querySelector('.faq-container');
    if (faqContainer) {
      faqContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  getPopularSearches(): string[] {
    return ['password', 'admin', 'employee', 'runner', 'product', 'event', 'donation', 'expenditure', 'order'];
  }

  onQuickSearch(term: string): void {
    this.searchQuery = term;
    this.onSearchSubmit();
  }

  openHelpDocument(): void {
    window.open('assets/HelpDocument.pdf', '_blank');
  }
}
