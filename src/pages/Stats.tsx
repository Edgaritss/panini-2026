import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { sections, stickersBySection, TOTAL } from '../data/album';
import { useAlbumStore } from '../store/useAlbumStore';
import { Icon } from '../components/Icon';
import { RecentActivityCard } from '../components/RecentActivityCard';

interface SectionStat {
  code: string;
  name: string;
  group: string | null;
  owned: number;
  total: number;
  pct: number;
}

interface GroupStat {
  group: string;
  total: number;
  owned: number;
  pct: number;
}

interface RepeatedRow {
  id: string;
  code: string;
  number: number;
  sectionName: string;
  count: number;
  spare: number;
}

export function Stats() {
  const counts = useAlbumStore((s) => s.counts);
  const firstAddedAt = useAlbumStore((s) => s.firstAddedAt);

  const { perSection, perGroup, owned, duplicates, totalRegistered, repeated } =
    useMemo(() => {
      const perSection: SectionStat[] = [];
      const groupAcc = new Map<string, { total: number; owned: number }>();
      let owned = 0;
      let duplicates = 0;
      let totalRegistered = 0;
      const repeated: RepeatedRow[] = [];

      for (const section of sections) {
        const all = stickersBySection.get(section.code) ?? [];
        let secOwned = 0;
        for (const st of all) {
          const c = counts[st.id] ?? 0;
          if (c >= 1) {
            owned += 1;
            secOwned += 1;
          }
          if (c > 0) totalRegistered += c;
          if (c > 1) {
            const spare = c - 1;
            duplicates += spare;
            repeated.push({
              id: st.id,
              code: st.sectionCode,
              number: st.number,
              sectionName: section.name,
              count: c,
              spare,
            });
          }
        }
        const total = all.length;
        const pct = total ? secOwned / total : 0;
        perSection.push({
          code: section.code,
          name: section.name,
          group: section.group,
          owned: secOwned,
          total,
          pct,
        });
        const groupKey = section.group ?? section.code;
        const cur = groupAcc.get(groupKey) ?? { total: 0, owned: 0 };
        cur.total += total;
        cur.owned += secOwned;
        groupAcc.set(groupKey, cur);
      }

      const perGroup: GroupStat[] = Array.from(groupAcc.entries())
        .map(([group, v]) => ({
          group,
          total: v.total,
          owned: v.owned,
          pct: v.total ? v.owned / v.total : 0,
        }))
        .sort((a, b) =>
          a.group === 'FWC' ? -1 : b.group === 'FWC' ? 1 : a.group.localeCompare(b.group),
        );

      repeated.sort((a, b) => b.spare - a.spare || a.id.localeCompare(b.id));

      return {
        perSection,
        perGroup,
        owned,
        duplicates,
        totalRegistered,
        repeated: repeated.slice(0, 10),
      };
    }, [counts]);

  const pctTotal = TOTAL ? owned / TOTAL : 0;
  const days = firstAddedAt
    ? Math.max(1, Math.floor((Date.now() - firstAddedAt) / (1000 * 60 * 60 * 24)))
    : 0;
  const avgPct =
    perSection.reduce((acc, s) => acc + s.pct, 0) / Math.max(1, perSection.length);
  const completed = perSection.filter((s) => s.owned === s.total).length;

  const sorted = [...perSection].sort(
    (a, b) => b.pct - a.pct || a.name.localeCompare(b.name),
  );
  const topComplete = sorted.slice(0, 5);
  const everyZero = perSection.every((s) => s.owned === 0);
  const bottomComplete = everyZero
    ? []
    : [...perSection]
        .sort((a, b) => a.pct - b.pct || a.name.localeCompare(b.name))
        .slice(0, 5);

  const bestGroup = perGroup.reduce(
    (acc, g) => (g.pct > acc.pct ? g : acc),
    perGroup[0],
  );
  const worstGroup = perGroup.reduce(
    (acc, g) => (g.pct < acc.pct ? g : acc),
    perGroup[0],
  );
  const nearComplete = perSection
    .filter((s) => s.owned < s.total && s.total - s.owned <= 3 && s.owned > 0)
    .sort((a, b) => a.total - a.owned - (b.total - b.owned))[0];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-display-l text-on-surface">Estadísticas</h1>
        <p className="text-body text-on-surface-variant mt-1">
          Cómo va tu colección, en números.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Progreso total" value={`${(pctTotal * 100).toFixed(1)}%`}>
          <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full"
              style={{ width: `${pctTotal * 100}%` }}
            />
          </div>
        </KpiCard>
        <KpiCard
          label="Días coleccionando"
          value={firstAddedAt ? String(days) : '—'}
          hint={
            firstAddedAt
              ? `Desde ${new Date(firstAddedAt).toLocaleDateString()}`
              : 'Aún sin registros'
          }
        />
        <KpiCard
          label="Promedio por sección"
          value={`${(avgPct * 100).toFixed(1)}%`}
          hint={`Media entre las ${sections.length} secciones`}
        />
        <KpiCard
          label="Secciones completas"
          value={`${completed} / ${perSection.length}`}
          hint={completed === perSection.length ? '¡Álbum completo!' : 'Sigue así'}
        />
      </section>

      <RecentActivityCard />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Más completas" caption="Top 5">
          {topComplete.length === 0 ? (
            <EmptyState text="Aún sin progreso" />
          ) : (
            <RankList items={topComplete} />
          )}
        </Card>
        <Card title="Menos completas" caption="Bottom 5">
          {bottomComplete.length === 0 ? (
            <EmptyState text="Todas las secciones están en 0%" />
          ) : (
            <RankList items={bottomComplete} />
          )}
        </Card>
      </section>

      <Card title="Distribución por grupo">
        <div className="h-[420px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={perGroup.map((g) => ({
                group: g.group === 'FWC' ? 'FWC' : `Grupo ${g.group}`,
                pct: Math.round(g.pct * 1000) / 10,
                owned: g.owned,
                total: g.total,
              }))}
              layout="vertical"
              margin={{ top: 8, right: 24, bottom: 8, left: 16 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                stroke="var(--on-surface-variant)"
                fontSize={11}
              />
              <YAxis
                dataKey="group"
                type="category"
                stroke="var(--on-surface-variant)"
                fontSize={12}
                width={72}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-container)' }}
                contentStyle={{
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value, _name, item) => {
                  const p = (item as { payload: { owned: number; total: number } }).payload;
                  const n = typeof value === 'number' ? value : Number(value ?? 0);
                  return [`${n.toFixed(1)}% (${p.owned}/${p.total})`, 'Completado'];
                }}
                labelStyle={{ color: 'var(--on-surface)' }}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {perGroup.map((g) => (
                  <Cell
                    key={g.group}
                    fill={
                      g.pct >= 0.99
                        ? 'var(--owned)'
                        : g.pct >= 0.5
                          ? 'var(--secondary)'
                          : 'var(--surface-tint)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Las que más me sobran" caption="Top 10 repetidas">
        {repeated.length === 0 ? (
          <EmptyState text="Aún no tienes estampas repetidas" />
        ) : (
          <ul className="divide-y divide-outline-variant">
            {repeated.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-mono-code px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed-variant border border-error-container">
                    {r.code}
                    {r.number}
                  </span>
                  <span className="text-body text-on-surface truncate">
                    {r.sectionName}
                  </span>
                </div>
                <span className="text-small text-on-surface-variant tabular-nums shrink-0">
                  tengo {r.count} · sobran {r.spare}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Insights">
        <ul className="space-y-2 text-body text-on-surface">
          <Bullet>
            Llevas el{' '}
            <strong>{(pctTotal * 100).toFixed(1)}%</strong> del álbum (
            {owned}/{TOTAL} estampas).
          </Bullet>
          <Bullet>
            Has registrado <strong>{totalRegistered}</strong> estampas en total,
            contando {duplicates} repetidas.
          </Bullet>
          {bestGroup && (
            <Bullet>
              Tu grupo más completo es{' '}
              <strong>
                {bestGroup.group === 'FWC' ? 'FWC' : `Grupo ${bestGroup.group}`}
              </strong>{' '}
              con {(bestGroup.pct * 100).toFixed(1)}%.
            </Bullet>
          )}
          {worstGroup && worstGroup !== bestGroup && (
            <Bullet>
              Tu grupo menos avanzado es{' '}
              <strong>
                {worstGroup.group === 'FWC' ? 'FWC' : `Grupo ${worstGroup.group}`}
              </strong>{' '}
              con {(worstGroup.pct * 100).toFixed(1)}%.
            </Bullet>
          )}
          {nearComplete && (
            <Bullet>
              Te faltan solo{' '}
              <strong>{nearComplete.total - nearComplete.owned}</strong> estampas
              para completar{' '}
              <Link
                to={`/seccion/${nearComplete.code}`}
                className="text-secondary hover:underline"
              >
                {nearComplete.name}
              </Link>
              .
            </Bullet>
          )}
          {completed > 0 && (
            <Bullet>
              Ya completaste <strong>{completed}</strong>{' '}
              {completed === 1 ? 'sección' : 'secciones'}.
            </Bullet>
          )}
        </ul>
      </Card>
    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
  hint?: string;
  children?: React.ReactNode;
}

function KpiCard({ label, value, hint, children }: KpiProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-2 shadow-sm">
      <span className="text-caps text-on-surface-variant uppercase">{label}</span>
      <span className="text-[36px] leading-none font-bold text-on-surface tabular-nums">
        {value}
      </span>
      {hint && <span className="text-small text-on-surface-variant">{hint}</span>}
      {children}
    </div>
  );
}

interface CardProps {
  title: string;
  caption?: string;
  children: React.ReactNode;
}

function Card({ title, caption, children }: CardProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="text-heading text-on-surface">{title}</h2>
        {caption && (
          <span className="text-caps text-on-surface-variant uppercase">{caption}</span>
        )}
      </header>
      {children}
    </section>
  );
}

function RankList({ items }: { items: SectionStat[] }) {
  return (
    <ol className="space-y-3">
      {items.map((s, i) => (
        <li key={s.code} className="flex items-center gap-3">
          <span className="text-body-strong text-on-surface-variant w-6 tabular-nums">
            #{i + 1}
          </span>
          <Link
            to={`/seccion/${s.code}`}
            className="font-mono text-mono-code text-on-surface-variant w-12 hover:text-secondary"
          >
            {s.code}
          </Link>
          <Link
            to={`/seccion/${s.code}`}
            className="flex-1 text-body text-on-surface hover:text-secondary truncate"
          >
            {s.name}
          </Link>
          <div className="w-32 h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary"
              style={{ width: `${s.pct * 100}%` }}
            />
          </div>
          <span className="text-small text-on-surface-variant w-12 text-right tabular-nums">
            {Math.round(s.pct * 100)}%
          </span>
        </li>
      ))}
    </ol>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-body text-on-surface-variant text-center py-6">{text}</p>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <Icon
        name="check_circle"
        filled
        className="text-secondary mt-0.5 shrink-0"
        size={18}
      />
      <span>{children}</span>
    </li>
  );
}
