// help-section.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";

export interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
  category?: string;
  keywords?: string[];
}

@Component({
  selector: 'app-help-section',
  imports: [CommonModule, FormsModule, NavBarDefaultComponent],
  templateUrl: './help-section.component.html',
  styleUrl: './help-section.component.css'
})
export class HelpSectionComponent {
  searchQuery: string = '';
  selectedCategory: string = 'all';
  
  allFaqItems: FaqItem[] = [
    {
      question: "How do I register to be a runner?",
      answer: "1. Click on the register button.\n 2. Fill in your details to create a user account.\n 3. Click on the Register tab.\n 4. Complete your registration.\n 5. Click Runner Registration to register as a runner.",

      isOpen: false,
      category: "registration",
      keywords: ["register", "runner", "sign up", "account", "create"]
    },
    {
      question: "Why do I have to register to be a user?",
      answer: "Registration is required to ensure security, track your activities, provide personalized services, and maintain account-specific data. It also helps us verify users and prevent unauthorized access to the platform.",
      isOpen: false,
      category: "registration",
      keywords: ["register", "user", "security", "account", "verification"]
    },
    {
      question: "How do I reset my password, If I have forgotten it?",
      answer: "1. Go to the login page.\n 2. Click 'Forgot Password'.\n 3. Enter your email address.\n 4. Check your email for reset Code.\n 5.Insert Code. \n 6. Enter the reset code and create a new password.",
      isOpen: false,
      category: "account",
      keywords: ["password", "reset", "forgot", "login", "email"]
    },
    {
      question: "How do I update my profile information?",
      answer: "1. Log into your account.\n  2. Hover over your Name in the Profile icon, then Click Profile 3. Navigate to 'Profile Settings'.\n 4. Edit the information you want to change.\n 5. Click 'Save Changes' to update your profile.",
      isOpen: false,
      category: "account",
      keywords: ["profile", "update", "edit", "information", "settings"]
    },
   
    
  ];

  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'registration', label: 'Registration' },
    { value: 'account', label: 'Account Management' },
    { value: 'payment', label: 'Payment' },
    { value: 'billing', label: 'Billing' }
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
    // Close all open answers when search changes
    this.closeAllAnswers();
  }

  onCategoryChange(): void {
    // Close all open answers when category changes
    this.closeAllAnswers();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.closeAllAnswers();
  }

  toggleAnswer(index: number): void {
    const actualItem = this.filteredFaqItems[index];
    
    // Close all other items
    this.allFaqItems.forEach(item => {
      if (item !== actualItem) {
        item.isOpen = false;
      }
    });
    
    // Toggle the selected item
    actualItem.isOpen = !actualItem.isOpen;
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
}