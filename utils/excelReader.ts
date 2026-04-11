import ExcelJS from 'exceljs';
import { Cliente } from '../types/Cliente';

/**
 * Lee un archivo Excel con datos de clientes y devuelve un Map indexado por ID.
 *
 * El Excel debe tener la hoja "Clientes" con las columnas en este orden:
 * A: ID, B: Empresa, C: Contacto, D: Titulo, E: Region,
 * F: CodigoPostal, G: Pais, H: Ciudad, I: Telefono, J: Fax, K: Representantes
 *
 * @param rutaArchivo - Ruta al archivo .xlsx (relativa al cwd o absoluta)
 * @returns Map<string, Cliente> donde la key es el ID del cliente
 */
export async function leerClientesDesdeExcel(
  rutaArchivo: string
): Promise<Map<string, Cliente>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(rutaArchivo);

  const hoja = workbook.getWorksheet('Clientes');
  if (!hoja) {
    throw new Error(`No se encontró la hoja "Clientes" en ${rutaArchivo}`);
  }

  const clientes = new Map<string, Cliente>();

  // eachRow itera empezando en 1 (no en 0).
  // includeEmpty: false salta filas completamente vacías.
  hoja.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // Salteamos la fila 1 (headers)
    if (rowNumber === 1) return;

    // row.getCell(N) — las columnas también empiezan en 1, no en 0.
    // .text devuelve el valor como string (más seguro que .value, que puede ser
    // number, Date, formula object, etc. dependiendo del tipo de celda).
    const cliente: Cliente = {
      id: row.getCell(1).text.trim(),
      empresa: row.getCell(2).text.trim(),
      contacto: row.getCell(3).text.trim(),
      titulo: row.getCell(4).text.trim(),
      region: row.getCell(5).text.trim(),
      codigoPostal: row.getCell(6).text.trim(),
      pais: row.getCell(7).text.trim(),
      ciudad: row.getCell(8).text.trim(),
      telefono: row.getCell(9).text.trim(),
      fax: row.getCell(10).text.trim(),
      representantes: row.getCell(11).text.trim(),
    };

    // Si la fila no tiene ID, la salteamos (fila basura)
    if (!cliente.id) return;

    clientes.set(cliente.id, cliente);
  });

  return clientes;

}