import type { MetadataField } from '../../types/metadata';

export default function PlatformFieldTable({ fields, emptyLabel }: { fields: MetadataField[]; emptyLabel?: string }) {
  if (fields.length === 0) {
    return <p className="text-sm text-cyber-300">{emptyLabel ?? 'পড়ার মতো কোনো মেটাডেটা ফিল্ড পাওয়া যায়নি।'}</p>;
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {fields.map((f, i) => (
          <tr key={i} className="border-b border-cyber-700 last:border-0">
            <td className="whitespace-nowrap py-2 pr-3 align-top font-mono text-[10px] font-semibold uppercase tracking-wide text-cyber-400">
              {f.category}
            </td>
            <td className="py-2 pr-3 align-top font-medium text-cyber-100">{f.label}</td>
            <td className="py-2 align-top text-cyber-200">{f.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
