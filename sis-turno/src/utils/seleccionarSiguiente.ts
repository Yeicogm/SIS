import { Participante } from "../types";

export const PR_X_TURNO = 13;

interface ResultadoSeleccion {
  seleccionado: Participante | null;
  actualizados: Participante[];
  nuevoRound: boolean;
}

export function seleccionarSiguiente(
  participantes: Participante[],
  prxTurno: number = PR_X_TURNO,
): ResultadoSeleccion {
  const activos = participantes.filter((p) => p.pr > 0);

  if (activos.length === 0) {
    // Reiniciar PR al valor original (o la mitad si está herido) y resetear vecesJugadas
    const reiniciados = participantes.map((p) => ({
      ...p,
      pr: p.herido ? Math.max(1, Math.floor(p.prOriginal / 2)) : p.prOriginal,
      vecesJugadas: 0,
    }));
    return { seleccionado: null, actualizados: reiniciados, nuevoRound: true };
  }

  // Construir lista ponderada: cada participante aparece PR veces
  const listaPonderada: Participante[] = [];
  for (const p of activos) {
    for (let i = 0; i < p.pr; i++) {
      listaPonderada.push(p);
    }
  }

  const indice = Math.floor(Math.random() * listaPonderada.length);
  const seleccionado = listaPonderada[indice];

  const actualizados = participantes.map((p) => {
    const veces = p.vecesJugadas ?? 0;

    if (p.id === seleccionado.id) {
      // Seleccionado: PR baja por prxTurno + (acciones previas * 2), nunca menos de 0
      const nuevoPR = Math.max(0, p.pr - prxTurno - veces * 2);
      return { ...p, pr: nuevoPR, vecesJugadas: veces + 1 };
    } else if (p.pr > 0) {
      if (veces === 0) {
        // Aún no ha jugado: PR no puede bajar de 1
        return { ...p, pr: Math.max(1, p.pr - 1) };
      } else {
        // Ya jugó: decay más rápido según las veces que lleva jugadas
        const nuevoPR = p.pr < 3 ? Math.max(0, p.pr - 1) : Math.max(0, p.pr - 1 - veces);
        return { ...p, pr: nuevoPR };
      }
    }
    return p;
  });

  return { seleccionado, actualizados, nuevoRound: false };
}

export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
