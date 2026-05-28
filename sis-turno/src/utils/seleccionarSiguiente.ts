import { Participante } from '../types';

interface ResultadoSeleccion {
  seleccionado: Participante | null;
  actualizados: Participante[];
  nuevoRound: boolean;
}

export function seleccionarSiguiente(
  participantes: Participante[]
): ResultadoSeleccion {
  const activos = participantes.filter((p) => p.pr > 0);

  if (activos.length === 0) {
    // Reiniciar todos los PR al valor original
    const reiniciados = participantes.map((p) => ({
      ...p,
      pr: p.prOriginal,
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

  // Actualizar PR: seleccionado → 0, demás activos → PR - 1
  const actualizados = participantes.map((p) => {
    if (p.id === seleccionado.id) {
      return { ...p, pr: 0 };
    } else if (p.pr > 0) {
      return { ...p, pr: Math.max(0, p.pr - 1) };
    }
    return p;
  });

  return { seleccionado, actualizados, nuevoRound: false };
}

export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
