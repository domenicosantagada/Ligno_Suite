import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaPreventivi } from './lista-preventivi';

describe('ListaPreventivi', () => {
  let component: ListaPreventivi;
  let fixture: ComponentFixture<ListaPreventivi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaPreventivi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaPreventivi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
