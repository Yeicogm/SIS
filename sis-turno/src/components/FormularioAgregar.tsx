import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Participante } from "../types";
import { generarId } from "../utils/seleccionarSiguiente";
import { hablar } from "../utils/hablar";

interface Props {
  onAgregar: (p: Participante) => void;
}

export function FormularioAgregar({ onAgregar }: Props) {
  const [nombre, setNombre] = useState("");
  const [pr, setPr] = useState(3);
  const [esJugador, setEsJugador] = useState(true);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    setError("");
    const prFinal = Math.max(0, Math.min(99, pr));
    const nuevo: Participante = {
      id: generarId(),
      nombre: nombre.trim(),
      pr: prFinal,
      prOriginal: prFinal,
      esJugador,
      vecesJugadas: 0,
    };
    onAgregar(nuevo);
    hablar(`Agregado: ${nuevo.nombre}`);
    setNombre("");
    setPr(3);
    setEsJugador(true);
  }

  return (
    <form className="formulario-agregar" onSubmit={handleSubmit}>
      <h2 className="formulario-titulo">
        <UserPlus size={18} />
        Agregar Participante
      </h2>

      <div className="campo">
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del personaje"
          maxLength={40}
          autoComplete="off"
        />
        {error && <span className="error-msg">{error}</span>}
      </div>

      <div className="campo">
        <label htmlFor="pr">PR (Puntos de Ritmo)</label>
        <input
          id="pr"
          type="number"
          value={pr}
          onChange={(e) => setPr(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
          min={0}
          max={99}
        />
      </div>

      <div className="campo">
        <label>Tipo</label>
        <div className="radio-grupo">
          <label className={`radio-opcion ${esJugador ? "activo jugador" : ""}`}>
            <input type="radio" name="tipo" checked={esJugador} onChange={() => setEsJugador(true)} />
            Jugador
          </label>
          <label className={`radio-opcion ${!esJugador ? "activo enemigo" : ""}`}>
            <input type="radio" name="tipo" checked={!esJugador} onChange={() => setEsJugador(false)} />
            Enemigo
          </label>
        </div>
      </div>

      <button type="submit" className="btn btn-agregar">
        Agregar
      </button>
    </form>
  );
}
