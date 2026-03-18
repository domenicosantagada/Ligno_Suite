import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpostazioniCliente } from './impostazioni-cliente';

describe('ImpostazioniCliente', () => {
  let component: ImpostazioniCliente;
  let fixture: ComponentFixture<ImpostazioniCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpostazioniCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpostazioniCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
