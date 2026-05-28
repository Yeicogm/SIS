import { EstadoApp, Participante } from "../types";
import { seleccionarSiguiente } from "../utils/seleccionarSiguiente";

export type Accion =
  | { type: "AGREGAR_PARTICIPANTE"; payload: Participante }
  | { type: "ELIMINAR_PARTICIPANTE"; payload: string }
  | { type: "SIGUIENTE_TURNO" }
  | { type: "LIMPIAR_TODO" };

export const estadoInicial: EstadoApp = {
  participantes: [],
  historial: [],
  round: 1,
  turnoActual: 1,
  nombreAnunciado: null,
  esJugadorAnunciado: null,
  esperandoNuevoRound: false,
};

export function reducer(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.type) {
    case "AGREGAR_PARTICIPANTE":
      return {
        ...estado,
        participantes: [...estado.participantes, accion.payload],
      };

    case "ELIMINAR_PARTICIPANTE":
      return {
        ...estado,
        participantes: estado.participantes.filter((p) => p.id !== accion.payload),
        nombreAnunciado:
          estado.nombreAnunciado !== null &&
          estado.participantes.find((p) => p.id === accion.payload)?.nombre === estado.nombreAnunciado
            ? null
            : estado.nombreAnunciado,
        esJugadorAnunciado:
          estado.nombreAnunciado !== null &&
          estado.participantes.find((p) => p.id === accion.payload)?.nombre === estado.nombreAnunciado
            ? null
            : estado.esJugadorAnunciado,
      };

    case "SIGUIENTE_TURNO": {
      // Si estamos esperando para arrancar el nuevo round, ahora sí seleccionamos
      if (estado.esperandoNuevoRound) {
        const resultado = seleccionarSiguiente(estado.participantes);
        if (resultado.seleccionado === null) return estado;
        const vecesNuevas =
          resultado.actualizados.find((p) => p.id === resultado.seleccionado!.id)?.vecesJugadas ?? 1;
        const nuevoTurno = {
          turnoNumero: estado.turnoActual,
          nombre: resultado.seleccionado.nombre,
          esJugador: resultado.seleccionado.esJugador,
          timestamp: new Date(),
          round: estado.round,
          vecesJugadas: vecesNuevas,
        };
        return {
          ...estado,
          participantes: resultado.actualizados,
          historial: [nuevoTurno, ...estado.historial].slice(0, 50),
          turnoActual: estado.turnoActual + 1,
          nombreAnunciado: resultado.seleccionado.nombre,
          esJugadorAnunciado: resultado.seleccionado.esJugador,
          esperandoNuevoRound: false,
        };
      }

      const resultado = seleccionarSiguiente(estado.participantes);

      // Todos los PR llegaron a 0: resetear y pausar antes de empezar el nuevo round
      if (resultado.nuevoRound) {
        return {
          ...estado,
          participantes: resultado.actualizados,
          round: estado.round + 1,
          nombreAnunciado: null,
          esJugadorAnunciado: null,
          esperandoNuevoRound: true,
        };
      }

      if (resultado.seleccionado === null) return estado;

      const vecesNuevas2 =
        resultado.actualizados.find((p) => p.id === resultado.seleccionado!.id)?.vecesJugadas ?? 1;
      const nuevoTurnoJugado = {
        turnoNumero: estado.turnoActual,
        nombre: resultado.seleccionado.nombre,
        esJugador: resultado.seleccionado.esJugador,
        timestamp: new Date(),
        round: estado.round,
        vecesJugadas: vecesNuevas2,
      };

      return {
        ...estado,
        participantes: resultado.actualizados,
        historial: [nuevoTurnoJugado, ...estado.historial].slice(0, 50),
        turnoActual: estado.turnoActual + 1,
        nombreAnunciado: resultado.seleccionado.nombre,
        esJugadorAnunciado: resultado.seleccionado.esJugador,
        esperandoNuevoRound: false,
      };
    }

    case "LIMPIAR_TODO":
      return {
        ...estadoInicial,
        participantes: estado.participantes.map((p) => ({
          ...p,
          pr: p.prOriginal,
          vecesJugadas: 0,
        })),
      };

    default:
      return estado;
  }
}
