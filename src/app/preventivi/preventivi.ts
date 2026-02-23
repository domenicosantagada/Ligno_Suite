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
  // Nuova logica multipagina per il download del PDF
  downloadPDF() {
    const element = document.getElementById('invoice-preview-container');

    if (element) {
      // Aggiungiamo un po' di padding per evitare che il testo tocchi i bordi del PDF
      html2canvas(element, {scale: 2, useCORS: true, backgroundColor: '#ffffff'}).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');

        // Creiamo il PDF in formato A4
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Dimensioni del foglio A4 in millimetri
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Calcoliamo l'altezza proporzionata della nostra immagine
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0; // Posizione Y da cui iniziare a stampare l'immagine

        // Aggiungiamo la prima pagina
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        // Finché c'è ancora immagine da stampare, creiamo nuove pagine
        while (heightLeft > 0) {
          // Spostiamo la posizione Y verso l'alto (valore negativo) di una pagina esatta
          position = heightLeft - imgHeight;

          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Salvataggio del file
        const fileName = this.invoice().invoiceNumber ? `Preventivo_${this.invoice().invoiceNumber}.pdf` : 'Preventivo_Bozza.pdf';
        pdf.save(fileName);
      });
    } else {
      console.error("Elemento per l'anteprima del PDF non trovato!");
    }
  }
}
