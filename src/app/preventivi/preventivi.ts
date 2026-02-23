// src/app/preventivi/preventivi.ts
import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PreventiviService} from './preventivi.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-preventivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preventivi.html',
  styleUrl: './preventivi.css',
})
export class Preventivi {
  preventiviService = inject(PreventiviService);
  invoice = this.preventiviService.invoice;
  isPreview = signal(false);

  togglePreview() {
    this.isPreview.update(v => !v);
  }

  // Nuova logica per il download del PDF
  downloadPDF() {
    // Cerchiamo l'elemento HTML che contiene l'anteprima (lo abbiamo chiamato così nel Passo 4)
    const element = document.getElementById('invoice-preview-container');

    if (element) {
      // Usiamo html2canvas per fare uno "screenshot" ad alta risoluzione (scale: 2) del div
      html2canvas(element, {scale: 2, useCORS: true}).then((canvas) => {
        // Convertiamo il canvas in un'immagine
        const imgData = canvas.toDataURL('image/png');

        // Creiamo un nuovo documento PDF in formato A4 (portrait, millimetri)
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Calcoliamo le proporzioni dell'immagine per farla fittare nella pagina A4
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Aggiungiamo l'immagine al PDF e lo salviamo
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Diamo al file il nome dinamico in base al numero di preventivo
        const fileName = this.invoice().invoiceNumber ? `Preventivo_${this.invoice().invoiceNumber}.pdf` : 'Preventivo_Bozza.pdf';
        pdf.save(fileName);
      });
    } else {
      console.error("Elemento per l'anteprima del PDF non trovato!");
    }
  }
}
