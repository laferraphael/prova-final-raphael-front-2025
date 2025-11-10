import React, { useEffect, useState } from "react";

const BASE_URL = "http://18.231.19.200:8080";


export default function PessoasApp() {
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("")

  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetchPessoas();
  }, []);

  async function fetchPessoas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/pessoas`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erro ao carregar: ${res.status}`);
      const data = await res.json();
      setPessoas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);

    const dto = {
      nome: nome || null,
      dataNascimento: dataNascimento || null,
      email: email || null
    };

    try {
      const res = await fetch(`${BASE_URL}/pessoas`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
         },
        body: JSON.stringify(dto)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao criar: ${res.status} ${text}`);
      }

      const created = await res.json();
      setPessoas(prev => [created, ...prev]);

      setNome("");
      setDataNascimento("");
      setEmail("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Stocks — criação e listagem</h1>

        <form onSubmit={handleCreate} className="space-y-3 mb-6">

          <div className="grid grid-cols-2 gap-3">
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" className="p-2 border rounded" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Descrição" className="w-full p-2 border rounded" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} placeholder="Último valor" className="p-2 border rounded" />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Criar</button>
            <button type="button" onClick={fetchPessoas} className="px-4 py-2 bg-gray-200 rounded">Recarregar</button>
          </div>
        </form>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <div>
          <h2 className="text-xl font-semibold mb-2">Lista de Pessoas</h2>

          {loading ? (
            <div>Carregando...</div>
          ) : pessoas.length === 0 ? (
            <div>Nenhum ativo encontrado.</div>
          ) : (
            <ul className="space-y-3">
              {pessoas.map((s) => (
                <li key={s.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{s.nome}</div>
                      {s.email && <div className="text-sm text-gray-600">{s.email}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{s.dataNascimento ?? "-"}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
