import { requireAdmin } from "@/lib/auth";
import { listAllStages } from "@/lib/stages-server";
import { STAGE_TYPE_LABEL } from "@/lib/stage-labels";

export default async function CrmStagesPage() {
  await requireAdmin();
  const stages = await listAllStages();

  return (
    <div>
      <h1 className="font-display font-bold text-xl text-text mb-1">Этапы</h1>
      <p className="text-xs text-text-muted mb-4">
        Текущая линия этапов воронки. Редактор этапов появится позже — пока список только для просмотра.
      </p>

      <div className="card overflow-hidden divide-y divide-border">
        {stages.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-text-muted w-8 flex-shrink-0">#{s.order}</span>
            <span className="font-semibold text-text text-sm flex-1">{s.name}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted">
              {STAGE_TYPE_LABEL[s.type]}
            </span>
            {!s.active && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted">Выключен</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
