import { useAuth0 } from "@auth0/auth0-react";

export default function LoginButton() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Cadastro de Filmes</h1>
        <p className="text-gray-600 mb-6">Faça login para continuar</p>
        <button
          onClick={() => loginWithRedirect()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

