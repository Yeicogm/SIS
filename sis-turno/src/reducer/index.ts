import { EstadoApp, Participante } from "../types";
import { seleccionarSiguiente, PR_X_TURNO } from "../utils/seleccionarSiguiente";

function calcularPRxTurno(participantes: Participante[]): number {
  const jugadores = participantes.filter((p) => p.esJugador);
  const enemigos = participantes.filter((p) => !p.esJugador);
  if (jugadores.length < 2 || enemigos.length < 2) return PR_X_TURNO;
  const avgJugadores = jugadores.reduce((s, p) => s + p.prOriginal, 0) / jugadores.length;
  const avgEnemigos = enemigos.reduce((s, p) => s + p.prOriginal, 0) / enemigos.length;
  const diferencial = Math.abs(avgEnemigos - avgJugadores) / 5;
  if (diferencial <= 1) return PR_X_TURNO;
  return Math.max(6, PR_X_TURNO - Math.floor(diferencial * 2));
}

export type Accion =
  | { type: "AGREGAR_PARTICIPANTE"; payload: Participante }
  | { type: "ELIMINAR_PARTICIPANTE"; payload: string }
  | { type: "SIGUIENTE_TURNO" }
  | { type: "LIMPIAR_TODO" }
  | { type: "TOGGLE_HERIDO"; payload: string };

export const estadoInicial: EstadoApp = {
  participantes: [],
  historial: [],
  round: 1,
  turnoActual: 1,
  prxTurno: PR_X_TURNO,
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
        const prxTurnoEfectivo = calcularPRxTurno(estado.participantes);
        const resultado = seleccionarSiguiente(estado.participantes, prxTurnoEfectivo);
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
          prxTurno: prxTurnoEfectivo,
          nombreAnunciado: resultado.seleccionado.nombre,
          esJugadorAnunciado: resultado.seleccionado.esJugador,
          esperandoNuevoRound: false,
        };
      }

      const prxTurnoEfectivo2 =
        estado.historial.length === 0 ? calcularPRxTurno(estado.participantes) : estado.prxTurno;
      const resultado = seleccionarSiguiente(estado.participantes, prxTurnoEfectivo2);

      // Todos los PR llegaron a 0: resetear y pausar antes de empezar el nuevo round
      if (resultado.nuevoRound) {
        return {
          ...estado,
          participantes: resultado.actualizados,
          round: estado.round + 1,
          prxTurno: PR_X_TURNO,
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
        prxTurno: prxTurnoEfectivo2,
        nombreAnunciado: resultado.seleccionado.nombre,
        esJugadorAnunciado: resultado.seleccionado.esJugador,
        esperandoNuevoRound: false,
      };
    }

    case "TOGGLE_HERIDO": {
      return {
        ...estado,
        participantes: estado.participantes.map((p) => {
          if (p.id !== accion.payload) return p;
          if (p.herido) {
            // Quitar herido: restaurar PR original
            return { ...p, herido: false, pr: p.prOriginal };
          } else {
            // Marcar herido: bajar PR a la mitad (mínimo 1)
            return { ...p, herido: true, pr: Math.max(1, Math.floor(p.prOriginal / 2)) };
          }
        }),
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
