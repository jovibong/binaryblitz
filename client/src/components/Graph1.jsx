import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Graph1({ graphData }) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-80">
      <h3 className="text-white font-bold mb-4">Graph 1: Round 1 Ranking</h3>
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
          <Bar dataKey="R1" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
