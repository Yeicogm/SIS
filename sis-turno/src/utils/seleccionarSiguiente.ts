import { Participante } from "../types";

interface ResultadoSeleccion {
  seleccionado: Participante | null;
  actualizados: Participante[];
  nuevoRound: boolean;
}

export function seleccionarSiguiente(participantes: Participante[]): ResultadoSeleccion {
  const activos = participantes.filter((p) => p.pr > 0);

  if (activos.length === 0) {
    // Reiniciar todos los PR al valor original y resetear vecesJugadas
    const reiniciados = participantes.map((p) => ({
      ...p,
      pr: p.prOriginal,
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

  // Actualizar PR: seleccionado → 0 y vecesJugadas++, demás activos → PR - 1 (mínimo 1 si aún no han jugado)
  const actualizados = participantes.map((p) => {
    if (p.id === seleccionado.id) {
      return { ...p, pr: 0, vecesJugadas: (p.vecesJugadas ?? 0) + 1 };
    } else if (p.pr > 0) {
      // Si aún no ha jugado en este round, su PR no baja de 1
      const minPR = (p.vecesJugadas ?? 0) === 0 ? 1 : 0;
      return { ...p, pr: Math.max(minPR, p.pr - 1) };
    }
    return p;
  });

  return { seleccionado, actualizados, nuevoRound: false };
}

export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
