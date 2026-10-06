import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TurnosService } from '../../core/turnos.service';
import { PdfService } from '../../core/pdf.service';
import { formatearFecha } from '../../core/fechas';

@Component({
  selector: 'app-confirmacion',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './confirmacion.component.html',
  styleUrl: './confirmacion.component.css',
})
export class ConfirmacionComponent {
  private pdfService = inject(PdfService);

  turno = inject(TurnosService).ultimoTurno;
  formatearFecha = formatearFecha;

  descargarPdf(): void {
    const turno = this.turno();
    if (turno) this.pdfService.generarComprobante(turno);
  }
}
