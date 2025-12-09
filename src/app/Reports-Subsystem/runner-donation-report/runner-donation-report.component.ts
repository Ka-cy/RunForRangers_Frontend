import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { DonationService, Donation } from '../../API-Services/donation.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-runner-donation-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NavBarAdminComponent,
    BaseChartDirective
  ],
  templateUrl: './runner-donation-report.component.html',
  styleUrls: ['./runner-donation-report.component.css']
})
export class RunnerDonationReportComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  startDate: Date = new Date(new Date().setMonth(new Date().getMonth() - 1));
  endDate: Date = new Date();
  donations: Donation[] = [];
  chartConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Runner Donations',
        data: [],
        borderColor: '#ffa200ff',
        backgroundColor: 'rgba(0, 0, 0, 1)',
        fill: false,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Runner Donation Trends Over Time'
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

  constructor(private donationService: DonationService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.fetchDonations();
  }

  fetchDonations(): void {
    const start = this.startDate.toISOString().split('T')[0];
    const end = this.endDate.toISOString().split('T')[0];
    this.donationService.getRunnerDonationsByDateRange(start, end).subscribe({
      next: (data) => {
        // Filter for Runner donations
        this.donations = data.filter(donation => donation.type === 'Runner');
        this.updateChart();
        console.log('Donations fetched:', this.donations);
      },
      error: (error) => {
        console.error('Error fetching donations:', error);
      }
    });
  }

  getTotalAmount(): number {
    return this.donations.reduce((total, donation) => total + donation.amount, 0);
  }

  getAverageDonation(): number {
    if (this.donations.length === 0) return 0;
    return Math.round((this.getTotalAmount() / this.donations.length) * 100) / 100;
  }

  updateChart(): void {
    const dateGroups: { [key: string]: number } = {};
    this.donations.forEach(donation => {
      const dateKey = new Date(donation.date).toLocaleDateString();
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + donation.amount;
    });

    const labels = Object.keys(dateGroups).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime()
    );
    const data = labels.map(label => dateGroups[label]);

    this.chartConfig.data.labels = labels;
    this.chartConfig.data.datasets[0].data = data;
    this.chart?.update();
  }

  generatePdf(): void {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55); // #1f2937
      doc.text('Runner Donation Report', 105, 20, { align: 'center' });

      // Date Range
      doc.setFontSize(14);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128); // #6b7280
      doc.text(
        `Report Period: ${this.startDate.toLocaleDateString()} to ${this.endDate.toLocaleDateString()}`,
        105,
        30,
        { align: 'center' }
      );

      // Summary Statistics
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81); // #374151
      doc.text('Summary Statistics', 20, 50);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const totalDonations = this.donations.length;
      const totalAmount = this.getTotalAmount();
      const averageDonation = this.getAverageDonation();

      doc.text(`Total Donations: `, 20, 60);
      doc.setTextColor(59, 130, 246); // #3b82f6
      doc.text(`${totalDonations}`, 60, 60);

      doc.setTextColor(0, 0, 0);
      doc.text(`Total Amount: `, 80, 60);
      doc.setTextColor(5, 150, 105); // #059669
      doc.text(`R${totalAmount.toFixed(2)}`, 115, 60);

      doc.setTextColor(0, 0, 0);
      doc.text(`Average Donation: `, 140, 60);
      doc.setTextColor(245, 158, 11); // #f59e0b
      doc.text(`R${averageDonation.toFixed(2)}`, 185, 60);

      // Donation Details Table
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81); // #374151
      doc.text('Donation Details', 20, 80);

      // Table Header
      doc.setFontSize(12);
      doc.setFillColor(249, 250, 251); // #f9fafb
      doc.rect(20, 85, 170, 10, 'F');
      doc.setTextColor(55, 65, 81); // #374151
      doc.text('Donation ID', 22, 92);
      doc.text('Date', 80, 92);
      doc.text('Amount', 150, 92);

      // Table Rows
      let y = 100;
      this.donations.forEach((donation, index) => {
        const fillColor: [number, number, number] = index % 2 === 0
          ? [255, 255, 255]
          : [248, 250, 252];
        doc.setFillColor(...fillColor);
        doc.rect(20, y - 5, 170, 10, 'F');
        doc.setTextColor(55, 65, 81); // #374151
        doc.text(`#${donation.donationID}`, 22, y);
        doc.text(new Date(donation.date).toLocaleDateString(), 80, y);
        doc.setTextColor(5, 150, 105); // #059669
        doc.text(`R${donation.amount.toFixed(2)}`, 150, y);
        y += 10;
      });

      // Chart
      const canvas = this.chart?.chart?.canvas;
      if (canvas) {
        const chartImage = canvas.toDataURL('image/png', 1.0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81); // #374151
        doc.text('Donation Trends', 20, y + 10);
        doc.addImage(chartImage, 'PNG', 20, y + 15, 170, 85);
        y += 100;
      }

      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175); // #9ca3af
      doc.text(
        `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        105,
        y + 20,
        { align: 'center' }
      );

      // Save PDF
      doc.save(`runner_donation_report_${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    }
  }
}
