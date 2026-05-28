import { EstadoApp, Participante } from '../types';
import { seleccionarSiguiente } from '../utils/seleccionarSiguiente';

export type Accion =
  | { type: 'AGREGAR_PARTICIPANTE'; payload: Participante }
  | { type: 'ELIMINAR_PARTICIPANTE'; payload: string }
  | { type: 'SIGUIENTE_TURNO' }
  | { type: 'LIMPIAR_TODO' };

export const estadoInicial: EstadoApp = {
  participantes: [],
  historial: [],
  round: 1,
  turnoActual: 1,
  nombreAnunciado: null,
  esJugadorAnunciado: null,
};

export function reducer(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.type) {
    case 'AGREGAR_PARTICIPANTE':
      return {
        ...estado,
        participantes: [...estado.participantes, accion.payload],
      };

    case 'ELIMINAR_PARTICIPANTE':
      return {
        ...estado,
        participantes: estado.participantes.filter(
          (p) => p.id !== accion.payload
        ),
        nombreAnunciado:
          estado.nombreAnunciado !== null &&
          estado.participantes.find(
            (p) => p.id === accion.payload
          )?.nombre === estado.nombreAnunciado
            ? null
            : estado.nombreAnunciado,
        esJugadorAnunciado:
          estado.nombreAnunciado !== null &&
          estado.participantes.find(
            (p) => p.id === accion.payload
          )?.nombre === estado.nombreAnunciado
            ? null
            : estado.esJugadorAnunciado,
      };

    case 'SIGUIENTE_TURNO': {
      const resultado = seleccionarSiguiente(estado.participantes);

      if (resultado.nuevoRound) {
        // Ejecutar selección con los PR restaurados
        const resultadoPostReinicio = seleccionarSiguiente(
          resultado.actualizados
        );
        if (
          resultadoPostReinicio.seleccionado === null
        ) {
          return estado; // sin participantes
        }
        const nuevoTurnoJugado = {
          turnoNumero: estado.turnoActual,
          nombre: resultadoPostReinicio.seleccionado.nombre,
          esJugador: resultadoPostReinicio.seleccionado.esJugador,
          timestamp: new Date(),
        };
        return {
          ...estado,
          participantes: resultadoPostReinicio.actualizados,
          historial: [nuevoTurnoJugado, ...estado.historial].slice(0, 50),
          round: estado.round + 1,
          turnoActual: estado.turnoActual + 1,
          nombreAnunciado: resultadoPostReinicio.seleccionado.nombre,
          esJugadorAnunciado: resultadoPostReinicio.seleccionado.esJugador,
        };
      }

      if (resultado.seleccionado === null) return estado;

      const nuevoTurnoJugado = {
        turnoNumero: estado.turnoActual,
        nombre: resultado.seleccionado.nombre,
        esJugador: resultado.seleccionado.esJugador,
        timestamp: new Date(),
      };

      return {
        ...estado,
        participantes: resultado.actualizados,
        historial: [nuevoTurnoJugado, ...estado.historial].slice(0, 50),
        turnoActual: estado.turnoActual + 1,
        nombreAnunciado: resultado.seleccionado.nombre,
        esJugadorAnunciado: resultado.seleccionado.esJugador,
      };
    }

    case 'LIMPIAR_TODO':
      return { ...estadoInicial };

    default:
      return estado;
  }
}
