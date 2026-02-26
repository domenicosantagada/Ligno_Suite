import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {InvoiceData} from '../preventivi/preventivi.model';
import {Router} from '@angular/router'; // Importa il Router
import {PreventiviService} from '../preventivi/preventivi.service';

@Component({
  selector: 'app-lista-preventivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-preventivi.html',
  styleUrl: './lista-preventivi.css',
})
export class ListaPreventivi implements OnInit {
  preventiviService = inject(PreventiviService);
  router = inject(Router); // Inietta il router

  preventivi = signal<InvoiceData[]>([]);
  searchTerm = signal('');

  filteredPreventivi = computed(() => {
    const term = this.searchTerm().toLowerCase();

    return this.preventivi().filter(p =>
      // Convertiamo invoiceNumber in stringa prima di usare includes()
      (p.invoiceNumber && p.invoiceNumber.toString().includes(term)) ||
      (p.toName && p.toName.toLowerCase().includes(term))
    );
  });

  ngOnInit() {
    this.caricaPreventiviDalDb();
  }

  caricaPreventiviDalDb() {
    this.preventiviService.getTuttiIPreventivi().subscribe({
      next: (dati) => this.preventivi.set(dati),
      error: (err) => console.error('Errore durante il recupero dei preventivi:', err)
    });
  }

  // --- NUOVI METODI PER VISUALIZZA E MODIFICA ---

  visualizzaPreventivo(prev: InvoiceData) {
    // Usa il nuovo metodo del service
    this.preventiviService.caricaPreventivoPerModifica(prev);
    this.router.navigate(['/preventivi'], {queryParams: {preview: 'true'}});
  }

  modificaPreventivo(prev: InvoiceData) {
    // Usa il nuovo metodo del service
    this.preventiviService.caricaPreventivoPerModifica(prev);
    this.router.navigate(['/preventivi']);
  }

  // --- NUOVI METODI ---

  creaNuovo() {
    this.preventiviService.resetInvoice(); // Svuota i dati vecchi
    this.router.navigate(['/preventivi']); // Vai alla pagina di creazione
  }

  // --- FINE NUOVI METODI ---

  eliminaPreventivo(preventivo: InvoiceData) {
    // Controlliamo che esista l'ID del database
    if (!preventivo.id) return;

    // Nel messaggio (confirm) mostriamo l'invoiceNumber (es. "1")
    if (confirm(`Sei sicuro di voler eliminare il preventivo N° ${preventivo.invoiceNumber}?`)) {

      // Al service (e quindi al backend) passiamo l'ID del database (es. 1045)
      this.preventiviService.eliminaPreventivoDalDb(preventivo.id).subscribe({
        next: () => {
          // Aggiorniamo la lista filtrando per ID
          this.preventivi.update(list => list.filter(p => p.id !== preventivo.id));
        },
        error: (err) => console.error('Errore durante l\'eliminazione:', err)
      });
    }
  }
}
