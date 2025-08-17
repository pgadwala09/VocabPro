import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PronunciationReportData {
  userName: string;
  reportDate: string;
  overallScore: number;
  totalWords: number;
  totalRecordings: number;
  timeSpent: number; // in minutes
  
  // Detailed metrics
  pronunciationScores: Array<{
    word: string;
    score: number;
    attempts: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  
  phonemeAccuracy: Array<{
    phoneme: string;
    accuracy: number;
  }>;
  
  progressData: Array<{
    date: string;
    score: number;
    wordsPerMinute: number;
  }>;
  
  communicationStyle: {
    clarity: number;
    fluency: number;
    intonation: number;
    speakingRate: 'slow' | 'normal' | 'fast';
  };
  
  achievements: string[];
  focusAreas: string[];
  recommendations: string[];
}

class PDFExportService {
  // Generate comprehensive pronunciation insights PDF
  async generatePronunciationReport(data: PronunciationReportData): Promise<Blob> {
    try {
      // Create a temporary container for the report
      const reportContainer = this.createReportHTML(data);
      document.body.appendChild(reportContainer);
      
      // Wait for any dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate PDF using html2canvas + jsPDF
      const pdf = await this.htmlToPDF(reportContainer);
      
      // Clean up
      document.body.removeChild(reportContainer);
      
      return pdf;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  // Create HTML structure for the report
  private createReportHTML(data: PronunciationReportData): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      position: absolute;
      top: -10000px;
      left: -10000px;
    `;

    container.innerHTML = `
      <!-- Header Section -->
      <div style="text-align: center; margin-bottom: 40px; padding: 30px; background: rgba(255,255,255,0.1); border-radius: 20px; backdrop-filter: blur(10px);">
        <h1 style="font-size: 36px; font-weight: bold; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
          VocabPro Pronunciation Report
        </h1>
        <p style="font-size: 18px; margin: 10px 0; opacity: 0.9;">
          Comprehensive Analysis for ${data.userName}
        </p>
        <p style="font-size: 14px; margin: 0; opacity: 0.7;">
          Generated on ${new Date(data.reportDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      <!-- Executive Summary -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">
          📊 Executive Summary
        </h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #4ade80;">${Math.round(data.overallScore * 100)}%</div>
            <div style="font-size: 14px; opacity: 0.8;">Overall Score</div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #60a5fa;">${data.totalWords}</div>
            <div style="font-size: 14px; opacity: 0.8;">Words Practiced</div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #f472b6;">${data.totalRecordings}</div>
            <div style="font-size: 14px; opacity: 0.8;">Total Recordings</div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #fbbf24;">${Math.round(data.timeSpent)}</div>
            <div style="font-size: 14px; opacity: 0.8;">Minutes Practiced</div>
          </div>
        </div>
      </div>

      <!-- Word Performance Analysis -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">
          🎯 Word Performance Analysis
        </h2>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.3);">
                <th style="text-align: left; padding: 12px; font-weight: bold;">Word</th>
                <th style="text-align: center; padding: 12px; font-weight: bold;">Score</th>
                <th style="text-align: center; padding: 12px; font-weight: bold;">Attempts</th>
                <th style="text-align: center; padding: 12px; font-weight: bold;">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              ${data.pronunciationScores.map(word => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <td style="padding: 12px; font-weight: 500;">${word.word}</td>
                  <td style="text-align: center; padding: 12px;">
                    <span style="color: ${this.getScoreColor(word.score)}; font-weight: bold;">
                      ${Math.round(word.score * 100)}%
                    </span>
                  </td>
                  <td style="text-align: center; padding: 12px;">${word.attempts}</td>
                  <td style="text-align: center; padding: 12px;">
                    <span style="background: ${this.getDifficultyColor(word.difficulty)}; padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: bold;">
                      ${word.difficulty.toUpperCase()}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Communication Style Analysis -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">
          🗣️ Communication Style Analysis
        </h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Speaking Metrics</h3>
            <div style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span>Clarity</span>
                <span style="font-weight: bold; color: #4ade80;">${Math.round(data.communicationStyle.clarity * 100)}%</span>
              </div>
              <div style="background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px;">
                <div style="background: #4ade80; height: 100%; width: ${data.communicationStyle.clarity * 100}%; border-radius: 4px;"></div>
              </div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span>Fluency</span>
                <span style="font-weight: bold; color: #60a5fa;">${Math.round(data.communicationStyle.fluency * 100)}%</span>
              </div>
              <div style="background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px;">
                <div style="background: #60a5fa; height: 100%; width: ${data.communicationStyle.fluency * 100}%; border-radius: 4px;"></div>
              </div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span>Intonation</span>
                <span style="font-weight: bold; color: #f472b6;">${Math.round(data.communicationStyle.intonation * 100)}%</span>
              </div>
              <div style="background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px;">
                <div style="background: #f472b6; height: 100%; width: ${data.communicationStyle.intonation * 100}%; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Speaking Rate</h3>
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 36px; font-weight: bold; color: #fbbf24; margin-bottom: 10px;">
                ${data.communicationStyle.speakingRate.toUpperCase()}
              </div>
              <p style="opacity: 0.8; margin: 0;">
                ${this.getSpeakingRateDescription(data.communicationStyle.speakingRate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements and Focus Areas -->
      <div style="margin-bottom: 40px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
          <div>
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #4ade80;">
              🏆 Achievements
            </h2>
            <div style="background: rgba(74, 222, 128, 0.1); padding: 20px; border-radius: 15px; border: 1px solid rgba(74, 222, 128, 0.3);">
              ${data.achievements.length > 0 ? 
                data.achievements.map(achievement => `
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="margin-right: 10px;">✅</span>
                    <span>${achievement}</span>
                  </div>
                `).join('') : 
                '<p style="opacity: 0.7; margin: 0;">Keep practicing to unlock achievements!</p>'
              }
            </div>
          </div>
          <div>
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #f59e0b;">
              🎯 Focus Areas
            </h2>
            <div style="background: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: 15px; border: 1px solid rgba(245, 158, 11, 0.3);">
              ${data.focusAreas.length > 0 ? 
                data.focusAreas.map(area => `
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="margin-right: 10px;">🔍</span>
                    <span>${area}</span>
                  </div>
                `).join('') : 
                '<p style="opacity: 0.7; margin: 0;">Great job! No specific focus areas identified.</p>'
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">
          💡 Personalized Recommendations
        </h2>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px;">
          ${data.recommendations.map((rec, index) => `
            <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
              <span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px; flex-shrink: 0;">
                ${index + 1}
              </span>
              <p style="margin: 0; line-height: 1.6;">${rec}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 20px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.3);">
        <p style="margin: 0; opacity: 0.7; font-size: 14px;">
          Generated by VocabPro AI • Continue practicing to improve your pronunciation skills!
        </p>
      </div>
    `;

    return container;
  }

  // Convert HTML element to PDF using html2canvas + jsPDF
  private async htmlToPDF(element: HTMLElement): Promise<Blob> {
    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );

      // Return as blob
      return new Promise((resolve) => {
        pdf.output('blob').then((blob: Blob) => resolve(blob));
      });
    } catch (error) {
      console.error('Error converting HTML to PDF:', error);
      throw error;
    }
  }

  // Helper method to get color based on score
  private getScoreColor(score: number): string {
    if (score >= 0.8) return '#4ade80'; // Green
    if (score >= 0.6) return '#fbbf24'; // Yellow
    return '#f87171'; // Red
  }

  // Helper method to get difficulty color
  private getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'hard': return '#f87171';
      default: return '#6b7280';
    }
  }

  // Helper method to get speaking rate description
  private getSpeakingRateDescription(rate: string): string {
    switch (rate) {
      case 'slow': return 'Take your time to articulate clearly';
      case 'fast': return 'Consider slowing down for better clarity';
      case 'normal': return 'Perfect speaking pace!';
      default: return 'Keep practicing!';
    }
  }

  // Quick export function for download - simplified version with timeout
  async downloadReport(data: PronunciationReportData, filename?: string): Promise<void> {
    // Set a 10-second timeout to prevent getting stuck
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF export timeout')), 10000);
    });

    const exportPromise = (async () => {
      try {
        console.log('Creating PDF document...');
        
        // Create a simpler PDF without html2canvas to avoid getting stuck
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        console.log('Adding content to PDF...');
        
        // Add content directly to PDF
        this.addTextToPDF(pdf, data);

        console.log('Saving PDF...');
        
        // Save the PDF
        const pdfName = filename || `pronunciation-report-${data.userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(pdfName);
        
        console.log('PDF saved successfully:', pdfName);
        
      } catch (error) {
        console.error('Error in PDF generation:', error);
        throw error;
      }
    })();

    try {
      await Promise.race([exportPromise, timeoutPromise]);
    } catch (error) {
      console.error('PDF export failed, using fallback:', error);
      // Fallback: create a simple text-based report
      this.createFallbackReport(data);
    }
  }

  // Add text content directly to PDF (faster and more reliable)
  private addTextToPDF(pdf: jsPDF, data: PronunciationReportData): void {
    let yPos = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(0, 100, 200);
    pdf.text('VocabPro Pronunciation Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Comprehensive Analysis for ${data.userName}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    pdf.setFontSize(12);
    pdf.text(`Generated on ${new Date(data.reportDate).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 25;

    // Executive Summary
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text('📊 Executive Summary', margin, yPos);
    yPos += 15;

    pdf.setFontSize(12);
    const summaryData = [
      `Overall Score: ${Math.round(data.overallScore * 100)}%`,
      `Words Practiced: ${data.totalWords}`,
      `Total Recordings: ${data.totalRecordings}`,
      `Practice Time: ${Math.round(data.timeSpent)} minutes`
    ];

    summaryData.forEach(item => {
      pdf.text(`• ${item}`, margin + 5, yPos);
      yPos += 8;
    });
    yPos += 10;

    // Word Performance
    if (data.pronunciationScores.length > 0) {
      pdf.setFontSize(16);
      pdf.text('🎯 Word Performance Analysis', margin, yPos);
      yPos += 12;

      pdf.setFontSize(10);
      data.pronunciationScores.slice(0, 10).forEach(word => { // Limit to first 10 words
        const scoreText = `${word.word}: ${Math.round(word.score * 100)}% (${word.difficulty})`;
        pdf.text(`• ${scoreText}`, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 10;
    }

    // Communication Style
    pdf.setFontSize(16);
    pdf.text('🗣️ Communication Style', margin, yPos);
    yPos += 12;

    pdf.setFontSize(12);
    const styleData = [
      `Clarity: ${Math.round(data.communicationStyle.clarity * 100)}%`,
      `Fluency: ${Math.round(data.communicationStyle.fluency * 100)}%`,
      `Intonation: ${Math.round(data.communicationStyle.intonation * 100)}%`,
      `Speaking Rate: ${data.communicationStyle.speakingRate}`
    ];

    styleData.forEach(item => {
      pdf.text(`• ${item}`, margin + 5, yPos);
      yPos += 8;
    });
    yPos += 15;

    // Achievements
    if (data.achievements.length > 0) {
      pdf.setFontSize(16);
      pdf.setTextColor(0, 150, 0);
      pdf.text('🏆 Achievements', margin, yPos);
      yPos += 12;

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      data.achievements.forEach(achievement => {
        pdf.text(`✅ ${achievement}`, margin + 5, yPos);
        yPos += 8;
      });
      yPos += 10;
    }

    // Focus Areas
    if (data.focusAreas.length > 0) {
      pdf.setFontSize(16);
      pdf.setTextColor(200, 100, 0);
      pdf.text('🎯 Focus Areas', margin, yPos);
      yPos += 12;

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      data.focusAreas.forEach(area => {
        pdf.text(`🔍 ${area}`, margin + 5, yPos);
        yPos += 8;
      });
      yPos += 15;
    }

    // Recommendations
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 200);
    pdf.text('💡 Recommendations', margin, yPos);
    yPos += 12;

    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    data.recommendations.forEach((rec, index) => {
      const lines = pdf.splitTextToSize(`${index + 1}. ${rec}`, contentWidth - 10);
      lines.forEach((line: string) => {
        if (yPos > 270) { // Check if we need a new page
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 3;
    });

    // Footer
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Generated by VocabPro AI • Continue practicing to improve!', pageWidth / 2, 280, { align: 'center' });
  }

  // Fallback method if PDF generation fails
  private createFallbackReport(data: PronunciationReportData): void {
    const reportContent = `
VocabPro Pronunciation Report
============================
User: ${data.userName}
Date: ${new Date(data.reportDate).toLocaleDateString()}

EXECUTIVE SUMMARY
================
Overall Score: ${Math.round(data.overallScore * 100)}%
Words Practiced: ${data.totalWords}
Total Recordings: ${data.totalRecordings}
Practice Time: ${Math.round(data.timeSpent)} minutes

COMMUNICATION STYLE
==================
Clarity: ${Math.round(data.communicationStyle.clarity * 100)}%
Fluency: ${Math.round(data.communicationStyle.fluency * 100)}%
Intonation: ${Math.round(data.communicationStyle.intonation * 100)}%
Speaking Rate: ${data.communicationStyle.speakingRate}

ACHIEVEMENTS
===========
${data.achievements.map(a => `✅ ${a}`).join('\n')}

FOCUS AREAS
===========
${data.focusAreas.map(a => `🎯 ${a}`).join('\n')}

RECOMMENDATIONS
==============
${data.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Generated by VocabPro AI
    `.trim();

    // Create and download as text file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pronunciation-report-${data.userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Share report via native Web Share API
  async shareReport(data: PronunciationReportData): Promise<void> {
    try {
      const pdfBlob = await this.generatePronunciationReport(data);
      const file = new File([pdfBlob], `pronunciation-report-${data.userName}.pdf`, {
        type: 'application/pdf'
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'VocabPro Pronunciation Report',
          text: `Check out my pronunciation progress report from VocabPro!`,
          files: [file]
        });
      } else {
        // Fallback to download
        await this.downloadReport(data);
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      // Fallback to download
      await this.downloadReport(data);
    }
  }
}

export const pdfExportService = new PDFExportService();

