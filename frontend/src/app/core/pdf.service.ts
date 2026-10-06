import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { formatearFecha } from './fechas';
import { Turno } from './models';

const NOMBRE_CONSULTORIO = 'Consultorio Odontológico Dr. Martín Suárez';

@Injectable({ providedIn: 'root' })
export class PdfService {
  generarComprobante(turno: Turno): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(NOMBRE_CONSULTORIO, 20, 25);
    doc.setFontSize(12);
    doc.text('Comprobante de turno', 20, 34);
    doc.line(20, 40, 190, 40);

    doc.setFontSize(16);
    doc.text(`Código de turno: ${turno.codigo}`, 20, 55);

    doc.setFontSize(12);
    doc.text(`Fecha: ${formatearFecha(turno.fecha)}`, 20, 70);
    doc.text(`Hora: ${turno.hora} hs`, 20, 80);
    doc.text(`Paciente: ${turno.paciente.nombre} ${turno.paciente.apellido}`, 20, 90);
    doc.text(`DNI: ${turno.paciente.dni}`, 20, 100);

    doc.line(20, 110, 190, 110);
    doc.setFontSize(10);
    doc.text('Cancelaciones y reprogramaciones hasta 24 h antes en /mi-turno', 20, 120);

    doc.save(`turno-${turno.codigo}.pdf`);
  }
}
