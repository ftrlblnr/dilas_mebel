"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Eye, EyeOff, Pencil, Check, X, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";
import type { UserSummary } from "@/lib/users-server";

export default function UsersManager({ users, currentUserId }: { users: UserSummary[]; currentUserId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [savingResetId, setSavingResetId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/crm/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Не удалось создать менеджера");
        return;
      }
      showToast("Менеджер создан");
      setEmail(""); setName(""); setPassword(""); setShowForm(false);
      router.refresh();
    } catch {
      setError("Не удалось создать менеджера");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/crm/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error();
      showToast(active ? "Доступ включён" : "Доступ отключён");
      router.refresh();
    } catch {
      showToast("Не удалось изменить доступ", "error");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleToggleRole(u: UserSummary) {
    const nextRole = u.role === "ADMIN" ? "MANAGER" : "ADMIN";
    const confirmMsg =
      nextRole === "ADMIN"
        ? `Сделать «${u.name}» администратором? Он получит полный доступ ко всем разделам CRM.`
        : `Снять права администратора с «${u.name}»?`;
    if (!window.confirm(confirmMsg)) return;
    setChangingRoleId(u.id);
    try {
      const res = await fetch(`/api/crm/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast(nextRole === "ADMIN" ? "Права администратора выданы" : "Права администратора сняты");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось изменить роль", "error");
    } finally {
      setChangingRoleId(null);
    }
  }

  function startEdit(u: UserSummary) {
    setEditingId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
  }

  async function handleSaveEdit(id: string) {
    setSavingEditId(id);
    try {
      const res = await fetch(`/api/crm/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Данные обновлены");
      setEditingId(null);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось сохранить", "error");
    } finally {
      setSavingEditId(null);
    }
  }

  async function handleResetPassword(id: string) {
    if (resetPassword.length < 8) return;
    setSavingResetId(id);
    try {
      const res = await fetch(`/api/crm/users/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "");
      showToast("Пароль сброшен");
      setResettingId(null);
      setResetPassword("");
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : "Не удалось сбросить пароль", "error");
    } finally {
      setSavingResetId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-xl text-text">Менеджеры</h1>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 btn-primary py-2 px-4 text-sm">
          <Plus size={15} /> Добавить менеджера
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 mb-6 space-y-4 max-w-md">
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 block">Имя</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 block">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                className="input-field pr-10"
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 disabled:opacity-60">
            {submitting ? "Создание..." : "Создать менеджера"}
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={36} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted text-sm">Менеджеров пока нет</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Имя</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Email</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Роль</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Доступ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                    {editingId === u.id ? (
                      <>
                        <td className="px-4 py-3">
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field text-sm py-1" />
                        </td>
                        <td className="px-4 py-3">
                          <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="input-field text-sm py-1" />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-semibold text-text">{u.name}</td>
                        <td className="px-4 py-3 text-text-muted">{u.email}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-center">
                      {u.id === currentUserId ? (
                        <span
                          className="text-xs bg-surface border border-border text-text-muted px-2 py-0.5 rounded-full"
                          title="Нельзя изменить роль самому себе"
                        >
                          {u.role === "ADMIN" ? "Админ" : "Менеджер"}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={changingRoleId === u.id}
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-60",
                            u.role === "ADMIN" ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-surface border border-border text-text-muted hover:bg-surface/60"
                          )}
                          title={u.role === "ADMIN" ? "Снять права администратора" : "Сделать администратором"}
                        >
                          {u.role === "ADMIN" ? "Админ" : "Менеджер"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.role === "ADMIN" ? (
                        <span className="text-xs text-text-muted">—</span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(u.id, !u.active)}
                          disabled={togglingId === u.id}
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-60",
                            u.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"
                          )}
                        >
                          {u.active ? "Активен" : "Отключён"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSaveEdit(u.id)}
                            disabled={savingEditId === u.id}
                            className="text-primary disabled:opacity-50"
                          >
                            <Check size={15} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-text-muted">
                            <X size={15} />
                          </button>
                        </div>
                      ) : resettingId === u.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="password"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            placeholder="Новый пароль"
                            minLength={8}
                            className="input-field text-sm py-1 w-36"
                          />
                          <button
                            onClick={() => handleResetPassword(u.id)}
                            disabled={savingResetId === u.id || resetPassword.length < 8}
                            className="text-primary disabled:opacity-50"
                          >
                            <Check size={15} />
                          </button>
                          <button onClick={() => { setResettingId(null); setResetPassword(""); }} className="text-text-muted">
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => startEdit(u)} className="text-text-muted hover:text-primary" title="Редактировать">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setResettingId(u.id)} className="text-text-muted hover:text-primary" title="Сбросить пароль">
                            <KeyRound size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
