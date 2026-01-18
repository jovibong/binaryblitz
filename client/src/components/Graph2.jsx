import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

export default function Graph2({ graphData }) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-80">
      <h3 className="text-white font-bold mb-4">Graph 2: Score Improvement</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={graphData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              borderColor: "#334155",
            }}
          />
          <ReferenceLine y={0} stroke="#fff" />
          <Bar dataKey="Change">
            {graphData.map((e, i) => (
              <Cell key={i} fill={e.Change >= 0 ? "#4ade80" : "#f87171"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
