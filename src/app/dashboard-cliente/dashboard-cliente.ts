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
  styleUrl: './dashboard-cliente.css'
})
export class DashboardCliente implements OnInit {

  authService = inject(Auth);
  router = inject(Router);
  preventiviService = inject(PreventiviService);

  // Signal per conservare il nome del titolare e la data odierna
  nomeCliente = signal<string>('');
  dataOggi = signal<string>('');

  // Signal per conservare l'utente loggato
  utente = signal<any>(null);

  // Signal per conservare la lista dei preventivi ricevuti
  preventiviRicevuti = signal<InvoiceData[]>([]);

  ngOnInit() {
    const utenteLoggato = this.authService.getUtenteLoggato();

    if (utenteLoggato && utenteLoggato.ruolo !== 'CLIENTE') {
      this.router.navigate(['/home']);
      return;
    }

    this.utente.set(utenteLoggato);

    // CHIAMATA AL BACKEND: Recuperiamo i preventivi destinati a questa email
    if (utenteLoggato && utenteLoggato.email) {
      this.preventiviService.getPreventiviPerCliente(utenteLoggato.email).subscribe({
        next: (dati) => {
          this.preventiviRicevuti.set(dati);
        },
        error: (err) => {
          console.error('Errore nel recupero preventivi cliente', err);
        }
      });
    }

    if (utenteLoggato) {
      this.nomeCliente.set(utenteLoggato.nome);
    }

    this.impostaDataOggi();
  }

  apriPreventivo(prev: InvoiceData) {
    this.preventiviService.caricaPreventivoPerModifica(prev);

    this.router.navigate(['/preventivi'], {queryParams: {preview: 'true'}});
  }

  private impostaDataOggi() {
    const opzioni: Intl.DateTimeFormatOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
    let data = new Date().toLocaleDateString('it-IT', opzioni);
    data = data.charAt(0).toUpperCase() + data.slice(1);
    this.dataOggi.set(data);
  }

}
