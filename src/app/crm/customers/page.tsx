import Link from "next/link";
import { auth } from "@/lib/auth";
import { listCustomers } from "@/lib/customers-server";

const PAGE_SIZE = 30;

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function CrmCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const actor = { id: session?.user?.id ?? "", role: session?.user?.role ?? ("MANAGER" as const) };

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const search = one(sp.search);
  const page = Number(one(sp.page)) || 1;

  const { customers, total } = await listCustomers({ search, page, pageSize: PAGE_SIZE }, actor);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="font-display font-bold text-xl text-text">Клиенты</h1>
        <span className="text-xs text-text-muted">Всего: {total}</span>
      </div>

      <form className="card p-4 mb-4">
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="Имя или телефон..."
          className="input-field text-sm w-full max-w-sm"
        />
      </form>

      {customers.length === 0 ? (
        <div className="card p-10 text-center text-sm text-text-muted">Клиентов не найдено</div>
      ) : (
        <div className="card overflow-hidden divide-y divide-border">
          {customers.map((c) => (
            <Link key={c.id} href={`/crm/customers/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface/60 transition-colors">
              <div className="min-w-0">
                <p className="font-semibold text-text text-sm truncate">{c.fullName}</p>
                <p className="text-xs text-text-muted">+7{c.phone}</p>
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap">с {formatDate(c.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 text-xs text-text-muted">
          Стр. {page} из {totalPages}
        </div>
      )}
    </div>
  );
}
