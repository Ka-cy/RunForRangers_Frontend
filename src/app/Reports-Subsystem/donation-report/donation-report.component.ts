import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { DonationService, Donation } from '../../API-Services/donation.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';



@Component({
  selector: 'app-donation-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    NavBarAdminComponent,
    BaseChartDirective
  ],
  templateUrl: './donation-report.component.html',
  styleUrls: ['./donation-report.component.css']
})
export class DonationReportComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  startDate: Date = new Date(new Date().setMonth(new Date().getMonth() - 1));
  endDate: Date = new Date();
  donations: Donation[] = [];
  filterType: 'All' | 'Organisation' | 'Runner' = 'All';
  runners: { userId: number, firstName: string, surname: string }[] = [];
  selectedRunnerId: number | null = null;
  private apiUrl = 'https://localhost:7158/api/Runner/GetRunners';

  chartConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Organisation Donations',
          data: [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Runner Donations',
          data: [],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          fill: false,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Donation Trends Over Time'
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Amount (R)'
          },
          beginAtZero: true
        }
      }
    }
  };

  constructor(
    private donationService: DonationService,
    private http: HttpClient
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadRunners();
    this.fetchDonations();
  }

  loadRunners(): void {
    this.http.get<{ userId: number, firstName: string, surname: string }[]>(this.apiUrl)
      .subscribe({
        next: (runners) => {
          this.runners = runners;
          if (runners.length === 0) {
            console.warn('No runners found.');
          }
        },
        error: (error) => {
          console.error('Error loading runners:', error);
          alert('Failed to load runners.');
        }
      });
  }

  fetchDonations(): void {
    const start = this.startDate.toISOString().split('T')[0];
    const end = this.endDate.toISOString().split('T')[0];

    Promise.all([
      this.donationService.getOrgDonationsByDateRange(start, end).toPromise(),
      this.donationService.getRunnerDonationsByDateRange(start, end).toPromise()
    ]).then(([orgDonations, runnerDonations]) => {
      const allDonations = [
        ...(orgDonations || []).map(d => ({ ...d, type: 'Organisation' })),
        ...(runnerDonations || []).map(d => ({ ...d, type: 'Runner' }))
      ];

      this.donations = this.filterDonations(allDonations);
      this.updateChart();
    }).catch(error => {
      console.error('Error fetching donations:', error);
    });
  }

  filterDonations(allDonations: Donation[]): Donation[] {
    let filtered = allDonations;
    if (this.filterType !== 'All') {
      filtered = allDonations.filter(donation => donation.type === this.filterType);
    }
    if (this.filterType === 'Runner' && this.selectedRunnerId !== null) {
      filtered = filtered.filter(donation => donation.userId === this.selectedRunnerId);
    }
    return filtered;
  }

  onFilterChange(): void {
    if (this.filterType !== 'Runner') {
      this.selectedRunnerId = null; // Reset runner selection when not filtering by Runner
    }
    this.fetchDonations();
  }

  onRunnerSelect(): void {
    this.fetchDonations();
  }

  getTotalAmount(): number {
    return this.donations.reduce((total, donation) => total + donation.amount, 0);
  }

  getAverageDonation(): number {
    if (this.donations.length === 0) return 0;
    return Math.round((this.getTotalAmount() / this.donations.length) * 100) / 100;
  }

  updateChart(): void {
    const orgDateGroups: { [key: string]: number } = {};
    const runnerDateGroups: { [key: string]: number } = {};

    this.donations.forEach(donation => {
      const dateKey = new Date(donation.date).toLocaleDateString();
      if (donation.type === 'Organisation') {
        orgDateGroups[dateKey] = (orgDateGroups[dateKey] || 0) + donation.amount;
      } else if (donation.type === 'Runner') {
        runnerDateGroups[dateKey] = (runnerDateGroups[dateKey] || 0) + donation.amount;
      }
    });

    const allDates = new Set([
      ...Object.keys(orgDateGroups),
      ...Object.keys(runnerDateGroups)
    ]);
    const labels = Array.from(allDates).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime()
    );

    const orgData = labels.map(label => orgDateGroups[label] || 0);
    const runnerData = labels.map(label => runnerDateGroups[label] || 0);

    this.chartConfig.data.labels = labels;
    this.chartConfig.data.datasets[0].data = this.filterType === 'All' || this.filterType === 'Organisation' ? orgData : [];
    this.chartConfig.data.datasets[1].data = this.filterType === 'All' || this.filterType === 'Runner' ? runnerData : [];
    this.chart?.update();
  }

  generatePdf(): void {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const rowHeight = 10;
      const maxY = pageHeight - margin - 20; // Reserve space for footer
      let y = margin;

      const imageUrl = '/../assets/Images/RFRLogoNoBG.png';
        doc.addImage(imageUrl, 'PNG', 10, y, 50, 30);
        y += 30;


      // Function to add header on each page
      const addHeader = () => {
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // #1f2937
        doc.text('Donation Report', 105, y, { align: 'center' });
        y += 10;

        // Date Range and Filter Type
        doc.setFontSize(14);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128); // #6b7280
        doc.text(
          `Report Period: ${this.startDate.toLocaleDateString()} to ${this.endDate.toLocaleDateString()}`,
          105,
          y,
          { align: 'center' }
        );
        y += 8;
        doc.text(
          `Donation Type: ${this.filterType}`,
          105,
          y,
          { align: 'center' }
        );
        y += 8;
        if (this.filterType === 'Runner' && this.selectedRunnerId !== null) {
          const runner = this.runners.find(r => r.userId === this.selectedRunnerId);
          doc.text(
            `Runner: ${runner ? `${runner.firstName} ${runner.surname}` : 'Unknown'}`,
            105,
            y,
            { align: 'center' }
          );
          y += 10;
        } else {
          y += 2;
        }
      };

      // Function to add footer on each page
      const addFooter = () => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(156, 163, 175); // #9ca3af
        doc.text(
          `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
          105,
          pageHeight - 10,
          { align: 'center' }
        );
      };

      // Function to add new page and reset y position
      const addNewPage = () => {
        doc.addPage();
        y = margin;
        addHeader();
      };

      // First page header
      addHeader();
      addFooter();

      // Summary Statistics
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81); // #374151
      doc.text('Summary Statistics', 20, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const totalDonations = this.donations.length;
      const totalAmount = this.getTotalAmount();
      const averageDonation = this.getAverageDonation();

      doc.text(`Total Donations: `, 20, y);
      doc.setTextColor(59, 130, 246); // #3b82f6
      doc.text(`${totalDonations}`, 60, y);

      doc.setTextColor(0, 0, 0);
      doc.text(`Total Amount: `, 80, y);
      doc.setTextColor(5, 150, 105); // #059669
      doc.text(`R${totalAmount.toFixed(2)}`, 115, y);

      doc.setTextColor(0, 0, 0);
      doc.text(`Average Donation: `, 140, y);
      doc.setTextColor(245, 158, 11); // #f59e0b
      doc.text(`R${averageDonation.toFixed(2)}`, 185, y);
      y += 15;

      // Donation Details Table
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81); // #374151
      doc.text('Donation Details', 20, y);
      y += 10;

      // Table Header
      const addTableHeader = () => {
        doc.setFontSize(12);
        doc.setFillColor(249, 250, 251); // #f9fafb
        doc.rect(20, y - 5, 170, 10, 'F');
        doc.setTextColor(55, 65, 81); // #374151
        doc.text('Donation ID', 22, y);
        doc.text('Date', 60, y);
        doc.text('Type', 100, y);
        doc.text('Amount', 150, y);
        y += 10;
      };

      addTableHeader();

      // Table Rows
      this.donations.forEach((donation, index) => {
        if (y > maxY - rowHeight) {
          addFooter();
          addNewPage();
          addTableHeader();
        }

        const fillColor: [number, number, number] = index % 2 === 0
          ? [255, 255, 255]
          : [248, 250, 252];
        doc.setFillColor(...fillColor);
        doc.rect(20, y - 5, 170, 10, 'F');
        doc.setTextColor(55, 65, 81); // #374151
        doc.text(`#${donation.donationID}`, 22, y);
        doc.text(new Date(donation.date).toLocaleDateString(), 60, y);
        doc.text(donation.type, 100, y);
        doc.setTextColor(5, 150, 105); // #059669
        doc.text(`R${donation.amount.toFixed(2)}`, 150, y);
        y += rowHeight;
      });

      // Chart
      if (y > maxY - 100) {
        addFooter();
        addNewPage();
      }

      const canvas = this.chart?.chart?.canvas;
      if (canvas) {
        const chartImage = canvas.toDataURL('image/png', 1.0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81); // #374151
        doc.text('Donation Trends', 20, y);
        y += 5;
        doc.addImage(chartImage, 'PNG', 20, y, 170, 85);
        y += 100;
      }

      // Add footer to the last page
      addFooter();

      // Save PDF
      const runner = this.runners.find(r => r.userId === this.selectedRunnerId);
      const fileName = this.selectedRunnerId && this.filterType === 'Runner'
        ? `donation_report_runner_${runner ? runner.firstName + '_' + runner.surname : 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`
        : `donation_report_${this.filterType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    }
  }
}
