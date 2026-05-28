export interface Participante {
  id: string;
  nombre: string;
  pr: number;
  prOriginal: number;
  esJugador: boolean;
  vecesJugadas: number;
  herido?: boolean;
}

export interface TurnoJugado {
  turnoNumero: number;
  nombre: string;
  esJugador: boolean;
  timestamp: Date;
  round: number;
  vecesJugadas: number;
}

export interface EstadoApp {
  participantes: Participante[];
  historial: TurnoJugado[];
  round: number;
  turnoActual: number;
  prxTurno: number;
  nombreAnunciado: string | null;
  esJugadorAnunciado: boolean | null;
  esperandoNuevoRound: boolean;
}
