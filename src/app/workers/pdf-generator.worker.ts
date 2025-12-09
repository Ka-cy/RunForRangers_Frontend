/// <reference lib="webworker" />

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

addEventListener('message', async ({ data }) => {
  const { type, payload } = data;
  
  try {
    switch (type) {
      case 'GENERATE_PDF':
        await generatePDF(payload);
        break;
      default:
        postMessage({ type: 'ERROR', error: 'Unknown message type' });
    }
  } catch (error) {
    postMessage({ 
      type: 'ERROR', 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

async function generatePDF(payload: {
  htmlContent: string;
  timestamp: string;
  reportData: any;
}) {
  try {
    postMessage({ type: 'PROGRESS', message: 'Preparing report content...' });
    
    // Create a temporary DOM element to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = payload.htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = '#ffffff';
    
    // Append to body temporarily
    document.body.appendChild(tempDiv);
    
    postMessage({ type: 'PROGRESS', message: 'Capturing content as image...' });
    
    // Configure html2canvas options
    const canvas = await html2canvas(tempDiv, {
      scale: 1.2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      height: tempDiv.scrollHeight,
      width: tempDiv.scrollWidth,
      scrollX: 0,
      scrollY: 0,
      logging: false
    });
    
    // Remove the temporary element
    document.body.removeChild(tempDiv);
    
    postMessage({ type: 'PROGRESS', message: 'Creating PDF document...' });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 10; // Top margin
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 20);
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);
    }
    
    postMessage({ type: 'PROGRESS', message: 'Finalizing PDF...' });
    
    // Convert PDF to blob
    const pdfBlob = pdf.output('blob');
    const filename = `Expenditure_Report_${payload.timestamp}.pdf`;
    
    postMessage({ 
      type: 'SUCCESS', 
      pdfBlob: pdfBlob,
      filename: filename,
      message: 'PDF generated successfully!' 
    });
    
  } catch (error) {
    postMessage({ 
      type: 'ERROR', 
      error: error instanceof Error ? error.message : 'PDF generation failed' 
    });
  }
}
