import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {InvoiceData} from '../preventivi/preventivi.model';
import {RouterLink} from '@angular/router';
import {PreventiviService} from '../preventivi/preventivi.service'; // Importa il service

@Component({
  selector: 'app-lista-preventivi',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-preventivi.html',
  styleUrl: './lista-preventivi.css',
})
export class ListaPreventivi implements OnInit {
  // Inietta il servizio che comunica con Spring Boot
  preventiviService = inject(PreventiviService);

  // Il signal parte con un array vuoto invece che con i dati di esempio
  preventivi = signal<InvoiceData[]>([]);

  // Segnale per il termine di ricerca
  searchTerm = signal('');

  // Computed per filtrare dinamicamente la lista (rimane uguale)
  filteredPreventivi = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.preventivi().filter(p =>
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term)) ||
      (p.toName && p.toName.toLowerCase().includes(term))
    );
  });

  // ngOnInit scatta in automatico appena apri la pagina "Archivio Preventivi"
  ngOnInit() {
    this.caricaPreventiviDalDb();
  }

  // Metodo che chiama il backend e aggiorna la tabella
  caricaPreventiviDalDb() {
    this.preventiviService.getTuttiIPreventivi().subscribe({
      next: (dati) => {
        // Quando Spring Boot risponde, inseriamo i dati nel signal
        this.preventivi.set(dati);
      },
      error: (err) => {
        console.error('Errore durante il recupero dei preventivi:', err);
      }
    });
  }
  

  // Metodo per eliminare in modo definitivo dal database
  eliminaPreventivo(numero: string) {
    if (!numero) return; // Controllo di sicurezza

    if (confirm(`Sei sicuro di voler eliminare definitivamente il preventivo ${numero}?`)) {

      // Chiamata al backend per eliminare dal DB
      this.preventiviService.eliminaPreventivoDalDb(numero).subscribe({
        next: () => {
          // Se il backend risponde con successo, lo togliamo anche dalla schermata
          this.preventivi.update(list => list.filter(p => p.invoiceNumber !== numero));
          alert(`Preventivo ${numero} eliminato con successo!`);
        },
        error: (err) => {
          console.error('Errore durante l\'eliminazione:', err);
          alert('Si è verificato un errore durante l\'eliminazione dal database.');
        }
      });

    }
  }
}
