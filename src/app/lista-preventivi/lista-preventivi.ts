import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {InvoiceData} from '../preventivi/preventivi.model';
// Router: Serve per far "viaggiare" l'utente da una pagina all'altra via codice
import {Router} from '@angular/router';
import {PreventiviService} from '../preventivi/preventivi.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-preventivi',
  standalone: true, // Componente indipendente (non ha bisogno di un modulo globale)
  imports: [CommonModule, FormsModule], // Necessario per il two-way binding [(ngModel)] nella barra di ricerca
  templateUrl: './lista-preventivi.html',
  styleUrl: './lista-preventivi.css',
})
export class ListaPreventivi implements OnInit {

  /* ==========================================================================
     DEPENDENCY INJECTION (Iniezione delle dipendenze)
     ========================================================================== */
  preventiviService = inject(PreventiviService); // Inietta il service che comunica col backend
  router = inject(Router); // Inietta il router per gestire i cambi di pagina

  /* ==========================================================================
     STATO DEL COMPONENTE (Gestito tramite Signals)
     ========================================================================== */

  // Signal che contiene l'elenco completo dei preventivi caricati dal Database.
  // Inizializzato come un array vuoto [].
  preventivi = signal<InvoiceData[]>([]);

  // Signal che contiene il testo digitato dall'utente nella barra di ricerca.
  searchTerm = signal('');

  /**
   * COMPUTED SIGNAL (Signal Calcolato)
   * Questa è una delle funzioni più potenti di Angular 16+.
   * 'filteredPreventivi' non viene modificato a mano. Si ricalcola DA SOLO e in automatico
   * ogni volta che cambia 'preventivi' o cambia 'searchTerm'.
   * Se scrivi "Mario" nella barra di ricerca, Angular esegue subito questo blocco di codice.
   */
  filteredPreventivi = computed(() => {
    // 1. Prendiamo il termine di ricerca e lo mettiamo tutto in minuscolo per una ricerca "case-insensitive"
    const term = this.searchTerm().toLowerCase();

    // 2. Filtriamo l'array originale
    return this.preventivi().filter(p =>
      // Cerchiamo sia nel numero del preventivo (convertito in stringa)...
      (p.invoiceNumber && p.invoiceNumber.toString().includes(term)) ||
      // ...sia nel nome del cliente
      (p.toName && p.toName.toLowerCase().includes(term))
    );
  });

  /* ==========================================================================
     CICLO DI VITA E RECUPERO DATI
     ========================================================================== */

  // Scatta non appena la pagina viene visualizzata
  ngOnInit() {
    this.caricaPreventiviDalDb();
  }

  /**
   * Chiama il Service per fare una richiesta GET al backend (Spring Boot).
   */
  caricaPreventiviDalDb() {
    this.preventiviService.getTuttiIPreventivi().subscribe({
      // Se il backend risponde con successo, riempiamo il Signal 'preventivi' con i dati
      next: (dati) => this.preventivi.set(dati),
      // Se qualcosa va storto, stampiamo l'errore in console
      error: (err) => console.error('Errore durante il recupero dei preventivi:', err)
    });
  }

  /* ==========================================================================
     AZIONI DI NAVIGAZIONE E MODIFICA
     ========================================================================== */

  /**
   * Apre un preventivo in sola lettura (Modalità Anteprima).
   */
  visualizzaPreventivo(prev: InvoiceData) {
    // 1. Copiamo i dati di questo preventivo dentro il Service (così la pagina successiva li trova pronti)
    this.preventiviService.caricaPreventivoPerModifica(prev);

    // 2. Navighiamo verso la pagina di creazione preventivi, MA passiamo un "Query Parameter" (es. ?preview=true)
    // Il componente 'Preventivi' leggerà questo URL e capirà che deve mostrare solo l'anteprima PDF.
    this.router.navigate(['/preventivi'], {queryParams: {preview: 'true'}});
  }

  /**
   * Apre un preventivo per modificarne i dati.
   */
  modificaPreventivo(prev: InvoiceData) {
    // 1. Carica i dati nel Service
    this.preventiviService.caricaPreventivoPerModifica(prev);
    // 2. Naviga alla pagina (senza parametri, quindi si aprirà in modalità "Modifica form")
    this.router.navigate(['/preventivi']);
  }

  /**
   * Crea un documento da zero.
   */
  creaNuovo() {
    // Resetta il Service: svuota tutti i campi per evitare che ci siano rimasugli del preventivo precedente
    this.preventiviService.resetInvoice();
    // Naviga alla pagina
    this.router.navigate(['/preventivi']);
  }

  /* ==========================================================================
     ELIMINAZIONE DATI
     ========================================================================== */

  eliminaPreventivo(preventivo: InvoiceData) {
    if (!preventivo.id) return;

    Swal.fire({
      title: 'Sei sicuro?',
      text: `Vuoi davvero eliminare il preventivo N° ${preventivo.invoiceNumber}? L'azione è irreversibile.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sì, elimina',
      cancelButtonText: 'Annulla',
      reverseButtons: true, // Mette il tasto "Annulla" a sinistra e "Elimina" a destra
      customClass: {
        confirmButton: 'btn btn-danger px-4 rounded-pill ms-2',
        cancelButton: 'btn btn-outline-secondary px-4 rounded-pill'
      },
      buttonsStyling: false
    }).then((result) => {
      // Se l'utente clicca "Sì, elimina"
      if (result.isConfirmed) {
        this.preventiviService.eliminaPreventivoDalDb(preventivo.id!).subscribe({
          next: () => {
            this.preventivi.update(list => list.filter(p => p.id !== preventivo.id));
            Swal.fire({
              title: 'Eliminato!',
              text: 'Il preventivo è stato eliminato.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Errore durante l\'eliminazione:', err);
            Swal.fire('Errore', 'Impossibile eliminare il preventivo.', 'error');
          }
        });
      }
    });
  }
}
