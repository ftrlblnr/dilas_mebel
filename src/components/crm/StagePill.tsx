interface StageLike {
  name: string;
  color: string;
}

export default function StagePill({ stage }: { stage: StageLike }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1.5"
      style={{ background: `${stage.color}1A`, color: stage.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
      {stage.name}
    </span>
  );
}
