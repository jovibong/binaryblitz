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
  Label, // Add this
} from "recharts";

export default function Graph2({ graphData }) {
  // Calculate the exact mathematical center coordinate
  const medianPosition = (graphData.length - 1) / 2;

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-80">
      <h3 className="text-white font-bold mb-4">Graph 2: Score Improvement</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={graphData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

          {/* Main X-Axis for Names */}
          <XAxis dataKey="name" stroke="#94a3b8" />

          {/* Hidden X-Axis for perfect median placement */}
          <XAxis
            xAxisId="math"
            type="number"
            hide
            domain={[0, graphData.length - 1]}
          />

          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              borderColor: "#334155",
            }}
          />

          {/* Horizontal Zero Line */}
          <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />

          {/* Vertical Median Line */}
          <ReferenceLine
            xAxisId="math"
            x={medianPosition}
            stroke="#fbbf24"
            strokeDasharray="5 5"
            strokeWidth={2}
          >
            <Label
              value="R1 Median"
              position="top"
              fill="#fbbf24"
              fontSize={12}
              fontWeight="bold"
            />
          </ReferenceLine>

          <Bar dataKey="Change">
            {graphData.map((e, i) => (
              <Cell
                key={`cell-${i}`}
                fill={e.Change >= 0 ? "#4ade80" : "#f87171"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
