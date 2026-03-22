import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Auth} from '../auth/auth';
import {Router} from '@angular/router';
import {PreventiviService} from '../preventivi/preventivi.service';
import {InvoiceData} from '../preventivi/preventivi.model';

@Component({
  selector: 'app-dashboard-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-cliente.html',
  styleUrls: ['./dashboard-cliente.css'] // plural per convenzione Angular
})
export class DashboardCliente implements OnInit {

  // ======= Signals =======
  nomeCliente = signal<string>('');                     // nome del cliente loggato
  dataOggi = signal<string>('');                        // data odierna in formato leggibile
  utente = signal<any>(null);                            // dati dell'utente loggato
  preventiviRicevuti = signal<InvoiceData[]>([]);           // lista dei preventivi ricevuti

  // ======= Servizi iniettati =======
  private authService = inject(Auth);
  private router = inject(Router);
  private preventiviService = inject(PreventiviService);

  // ======= Ciclo di vita del componente =======
  ngOnInit() {
    this.inizializzaUtente();
    this.impostaDataOggi();
  }

  // ======= Metodi pubblici =======
  /**
   * Apre il preventivo selezionato in modalità preview.
   */
  apriPreventivo(preventivo: InvoiceData) {
    this.preventiviService.caricaPreventivoPerModifica(preventivo);
    this.router.navigate(['/preventivi'], {queryParams: {preview: 'true'}});
  }

  // ======= Metodi privati =======
  /**
   * Recupera l'utente loggato e carica i preventivi se è un cliente.
   * Se l'utente non è un cliente, lo reindirizza alla home.
   */
  private inizializzaUtente() {
    const utenteLoggato = this.authService.getUtenteLoggato();

    if (!utenteLoggato || utenteLoggato.ruolo !== 'CLIENTE') {
      this.router.navigate(['/home']);
      return;
    }

    this.utente.set(utenteLoggato);
    this.nomeCliente.set(utenteLoggato.nome);

    if (utenteLoggato.email) {
      this.caricaPreventivi(utenteLoggato.email);
    }
  }

  /**
   * Recupera i preventivi dal backend per l'email specificata.
   */
  private caricaPreventivi(email: string) {
    this.preventiviService.getPreventiviPerCliente(email).subscribe({
      next: dati => this.preventiviRicevuti.set(dati),
      error: err => console.error('Errore nel recupero preventivi cliente', err)
    });
  }

  /**
   * Imposta la signal `dataOggi` con la data odierna formattata in italiano.
   */
  private impostaDataOggi() {
    const opzioni: Intl.DateTimeFormatOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
    const data = new Date().toLocaleDateString('it-IT', opzioni);
    this.dataOggi.set(data.charAt(0).toUpperCase() + data.slice(1));
  }

}
