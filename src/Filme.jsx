import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState, useCallback } from "react";
import LoginButton from "./LoginButton.jsx";
import LogoutButton from "./LogoutButton.jsx";

const BASE_URL = "/api";

// Função para decodificar JWT (sem verificar assinatura, apenas para debug)
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Erro ao decodificar JWT:', e);
    return null;
  }
}

export default function FilmeApp() {
  const [filmes, setFilmes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("");

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [nota, setNota] = useState("");
  const [diretor, setDiretor] = useState("");

  const {
    user,
    isAuthenticated,
    getAccessTokenSilently
  } = useAuth0();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        // Tenta obter token sem audience primeiro (muitos backends não precisam)
        let accessToken;
        const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
        
        if (audience) {
          // Se há audience configurado, usa ele
          accessToken = await getAccessTokenSilently({
            authorizationParams: {
              audience: audience
            }
          });
        } else {
          // Tenta sem audience (token genérico)
          accessToken = await getAccessTokenSilently();
        }
        
        console.log('Token obtido:', accessToken ? 'Token presente' : 'Token vazio');
        if (accessToken) {
          const decoded = decodeJWT(accessToken);
          if (decoded) {
            console.log('🔍 Informações do Token JWT:');
            console.log('  - Issuer (iss):', decoded.iss);
            console.log('  - Audience (aud):', decoded.aud);
            console.log('  - Subject (sub):', decoded.sub);
            console.log('  - Expira em:', new Date(decoded.exp * 1000).toLocaleString());
            console.log('  - Scopes:', decoded.scope);
            console.log('  - Token completo (primeiros 50 chars):', accessToken.substring(0, 50) + '...');
          }
        }
        setToken(accessToken);
      } catch (e) {
        console.error('Erro ao buscar token:', e);
      }
    };

    if (isAuthenticated) {
      fetchToken();
    }
  }, [isAuthenticated, getAccessTokenSilently]);


  // Verificar se o usuário é administrador
  // O Auth0 pode retornar roles em diferentes claims
  const getUserRoles = () => {
    if (!user) return [];
    // Tenta diferentes possíveis claims
    return user['https://insper.edu.br/roles'] || 
           user['roles'] || 
           user['permissions'] || 
           [];
  };
  
  const userRoles = getUserRoles();
  const isAdmin = Array.isArray(userRoles) && (
    userRoles.includes('ADMIN') || 
    userRoles.includes('admin') ||
    userRoles.some(r => r.toLowerCase() === 'admin')
  );

  const fetchFilmes = useCallback(async () => {
    if (!token) {
      console.log('Token não disponível para fetchFilmes');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('Fazendo requisição GET para /api/filmes com token');
      console.log('Header Authorization:', `Bearer ${token.substring(0, 20)}...`);
      const res = await fetch(`${BASE_URL}/filmes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Resposta recebida:', res.status, res.statusText);
      console.log('Headers da resposta:', Object.fromEntries(res.headers.entries()));
      if (!res.ok) {
        const text = await res.text();
        console.error('❌ Erro na resposta:', res.status, text);
        console.error('💡 Possíveis causas:');
        console.error('   1. Audience do token não corresponde ao esperado pelo backend');
        console.error('   2. Backend não está configurado para validar tokens do Auth0');
        console.error('   3. Token expirado ou inválido');
        console.error('   4. Backend espera um formato diferente de autenticação');
        throw new Error(`Erro ao carregar: ${res.status}`);
      }
      const data = await res.json();
      setFilmes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro em fetchFilmes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchFilmes();
    }
  }, [token, isAuthenticated, fetchFilmes]);

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);

    let currentToken = token;
    if (!currentToken) {
      try {
        const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
        if (audience) {
          currentToken = await getAccessTokenSilently({
            authorizationParams: { audience: audience }
          });
        } else {
          currentToken = await getAccessTokenSilently();
        }
        setToken(currentToken);
        if (!currentToken) {
          setError("Token de autenticação não disponível. Por favor, faça login novamente.");
          return;
        }
      } catch (e) {
        console.error('Erro ao buscar token:', e);
        setError("Erro ao obter token de autenticação. Por favor, faça login novamente.");
        return;
      }
    }

    const notaNum = parseFloat(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 5) {
      setError("A nota deve ser um número entre 0 e 5");
      return;
    }

    const dto = {
      nome: nome || null,
      descricao: descricao || null,
      nota: Math.round(notaNum * 10) / 10, // Arredondar para 1 casa decimal
      diretor: diretor || null
    };

    try {
      if (!currentToken) {
        const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
        if (audience) {
          currentToken = await getAccessTokenSilently({
            authorizationParams: { audience: audience }
          });
        } else {
          currentToken = await getAccessTokenSilently();
        }
      }
      
      console.log('Fazendo requisição POST para /api/filmes com token');
      const res = await fetch(`${BASE_URL}/filmes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`,
        },
        body: JSON.stringify(dto)
      });
      console.log('Resposta POST recebida:', res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao criar: ${res.status} ${text}`);
      }

      const created = await res.json();
      setFilmes(prev => [created, ...prev]);

      setNome("");
      setDescricao("");
      setNota("");
      setDiretor("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza que deseja excluir este filme?")) {
      return;
    }

    setError(null);
    try {
      let currentToken = token;
      if (!currentToken) {
        const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
        if (audience) {
          currentToken = await getAccessTokenSilently({
            authorizationParams: { audience: audience }
          });
        } else {
          currentToken = await getAccessTokenSilently();
        }
      }
      const res = await fetch(`${BASE_URL}/filmes/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Você não tem permissão para excluir filmes");
        }
        throw new Error(`Erro ao excluir: ${res.status}`);
      }

      setFilmes(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 font-sans">
      <div className="mb-4 flex items-center gap-4">
        <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
        <div>
          <h2 className="font-semibold">{user.name}</h2>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Cadastro de Filmes</h1>

        <form onSubmit={handleCreate} className="space-y-3 mb-6">
          <div className="grid grid-cols-1 gap-3">
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome do filme"
              className="p-2 border rounded"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descrição"
              className="p-2 border rounded"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Nota (0 a 5)"
              className="p-2 border rounded"
              required
            />
            <input
              value={diretor}
              onChange={e => setDiretor(e.target.value)}
              placeholder="Nome do diretor"
              className="p-2 border rounded"
              required
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Cadastrar Filme
            </button>
            <button type="button" onClick={fetchFilmes} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Recarregar
            </button>
          </div>
        </form>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">{error}</div>}

        <div>
          <h2 className="text-xl font-semibold mb-2">Lista de Filmes</h2>

          {loading ? (
            <div>Carregando...</div>
          ) : filmes.length === 0 ? (
            <div>Nenhum filme cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Nome</th>
                    <th className="border border-gray-300 p-2 text-left">Descrição</th>
                    <th className="border border-gray-300 p-2 text-left">Nota</th>
                    <th className="border border-gray-300 p-2 text-left">Diretor</th>
                    {isAdmin && (
                      <th className="border border-gray-300 p-2 text-left">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filmes.map((filme) => (
                    <tr key={filme.id}>
                      <td className="border border-gray-300 p-2">{filme.nome}</td>
                      <td className="border border-gray-300 p-2">{filme.descricao}</td>
                      <td className="border border-gray-300 p-2">{filme.nota}</td>
                      <td className="border border-gray-300 p-2">{filme.diretor}</td>
                      {isAdmin && (
                        <td className="border border-gray-300 p-2">
                          <button
                            onClick={() => handleDelete(filme.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

