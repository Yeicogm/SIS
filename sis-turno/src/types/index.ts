export interface Participante {
  id: string;
  nombre: string;
  pr: number;
  prOriginal: number;
  esJugador: boolean;
  vecesJugadas: number;
}

export interface TurnoJugado {
  turnoNumero: number;
  nombre: string;
  esJugador: boolean;
  timestamp: Date;
}

export interface EstadoApp {
  participantes: Participante[];
  historial: TurnoJugado[];
  round: number;
  turnoActual: number;
  nombreAnunciado: string | null;
  esJugadorAnunciado: boolean | null;
  esperandoNuevoRound: boolean;
}
