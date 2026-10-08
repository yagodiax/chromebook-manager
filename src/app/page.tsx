export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Chromebook Manager
        </h1>

        <p className="mt-2 text-gray-600">
          Gerenciamento e manutenção de Chromebooks
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">
              Chromebooks
            </h2>

            <p className="mt-2 text-3xl font-bold">
              0
            </p>

            <p className="text-sm text-gray-500">
              Cadastrados
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">
              Em manutenção
            </h2>

            <p className="mt-2 text-3xl font-bold">
              0
            </p>

            <p className="text-sm text-gray-500">
              Equipamentos
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">
              Disponíveis
            </h2>

            <p className="mt-2 text-3xl font-bold">
              0
            </p>

            <p className="text-sm text-gray-500">
              Equipamentos
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}