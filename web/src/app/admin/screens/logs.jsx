export default function Logs({ logs, total, loading, filters, setFilters, handleInput }) {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-semibold mb-4">Logs do Sistema</h1>

            {/* FILTROS */}
            <div className="grid grid-cols-6 gap-3 bg-white p-4 rounded-lg shadow">
                <select
                    name="level"
                    value={filters.level}
                    onChange={handleInput}
                    className="border p-2 rounded"
                >
                    <option value="">Nível</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Erro</option>
                    <option value="debug">Debug</option>
                </select>

                <input
                    type="text"
                    name="context"
                    placeholder="Contexto"
                    value={filters.context}
                    onChange={handleInput}
                    className="border p-2 rounded"
                />

                <input
                    type="date"
                    name="start"
                    value={filters.start}
                    onChange={handleInput}
                    className="border p-2 rounded"
                />

                <input
                    type="date"
                    name="end"
                    value={filters.end}
                    onChange={handleInput}
                    className="border p-2 rounded"
                />

                <input
                    type="text"
                    name="search"
                    placeholder="Buscar"
                    value={filters.search}
                    onChange={handleInput}
                    className="border p-2 rounded col-span-2"
                />
            </div>

            {/* TABELA */}
            <div className="mt-6 bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3">ID</th>
                            <th className="p-3">Nível</th>
                            <th className="p-3">Contexto</th>
                            <th className="p-3">Mensagem</th>
                            <th className="p-3">Data</th>
                            <th className="p-3">IP</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td className="p-4" colSpan="6">
                                    Carregando...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td className="p-4" colSpan="6">
                                    Nenhum log encontrado.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{log.id}</td>
                                    <td className="p-3">
                                        <span
                                            className={
                                                log.level === "error"
                                                    ? "text-red-600 font-bold"
                                                    : log.level === "warn"
                                                    ? "text-yellow-600 font-semibold"
                                                    : log.level === "debug"
                                                    ? "text-blue-600"
                                                    : "text-gray-700"
                                            }
                                        >
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="p-3">{log.context}</td>
                                    <td className="p-3 whitespace-pre-wrap text-sm">
                                        {log.message}
                                    </td>
                                    <td className="p-3">{log.created_at}</td>
                                    <td className="p-3">{log.ip}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINAÇÃO */}
            <div className="flex justify-between mt-4">
                <button
                    disabled={filters.page <= 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Anterior
                </button>

                <span>Página {filters.page}</span>

                <button
                    disabled={logs.length < 50}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Próxima
                </button>
            </div>
        </div>
    );
}
