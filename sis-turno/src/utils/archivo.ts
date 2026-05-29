import { Participante } from "../types";
import { generarId } from "./seleccionarSiguiente";

export function descargarParticipantes(participantes: Participante[]): void {
  const json = JSON.stringify(participantes, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participantes.sis";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function cargarParticipantesDesdeArchivo(): Promise<
  Participante[] | null
> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".sis,.json";
  return new Promise((resolve) => {
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Partial<Participante>[];
        if (!Array.isArray(parsed)) {
          resolve(null);
          return;
        }
        const participantes = parsed.map((p) => ({
          id: generarId(),
          nombre: p.nombre ?? "",
          pr: p.pr ?? p.prOriginal ?? 0,
          prOriginal: p.prOriginal ?? p.pr ?? 0,
          esJugador: p.esJugador ?? true,
          vecesJugadas: 0,
          herido: p.herido,
        }));
        resolve(participantes);
      } catch {
        resolve(null);
      }
    };
    input.oncancel = () => resolve(null);
    input.showPicker();
  });
}
