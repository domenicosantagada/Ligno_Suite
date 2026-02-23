import {Component, computed, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {InvoiceData} from '../preventivi/preventivi.model';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-lista-preventivi',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-preventivi.html',
  styleUrl: './lista-preventivi.css',
})
export class ListaPreventivi {
  // Dati di esempio (in futuro verranno caricati dal backend o dal service)
  preventivi = signal<InvoiceData[]>([
    {invoiceNumber: 'INV-001', toName: 'Mario Rossi SPA', date: '2023-10-15', total: 1250.00} as InvoiceData,
    {invoiceNumber: 'INV-002', toName: 'Luigi Bianchi', date: '2023-10-18', total: 450.50} as InvoiceData,
    {invoiceNumber: 'INV-003', toName: 'Falegnameria Artigiana', date: '2023-10-20', total: 3200.00} as InvoiceData,
  ]);

  // Segnale per il termine di ricerca
  searchTerm = signal('');

  // Computed per filtrare dinamicamente la lista
  filteredPreventivi = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.preventivi().filter(p =>
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term)) ||
      (p.toName && p.toName.toLowerCase().includes(term))
    );
  });

  // Metodo per eliminare visivamente una riga
  eliminaPreventivo(numero: string) {
    if (confirm(`Sei sicuro di voler eliminare il preventivo ${numero}?`)) {
      this.preventivi.update(list => list.filter(p => p.invoiceNumber !== numero));
    }
  }
}
