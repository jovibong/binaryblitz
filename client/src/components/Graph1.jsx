import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";

export default function Graph1({ graphData }) {
  // 1. Calculate the exact center coordinate
  // Indices are 0, 1, 2...
  // Median position is (count - 1) / 2.
  // For 2 players: (2-1)/2 = 0.5 (perfectly between index 0 and 1)
  const medianPosition = (graphData.length - 1) / 2;

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-80">
      <h3 className="text-white font-bold mb-4">Graph 1: Round 1 Ranking</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={graphData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

          {/* Main X-Axis for Names */}
          <XAxis dataKey="name" stroke="#94a3b8" />

          {/* 2. Hidden X-Axis for Math
              By adding a second X-Axis with type="number" and the same domain
              as our data count, we can place the line at exactly 0.5, 1.5, etc.
          */}
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
          <Bar dataKey="R1" fill="#8884d8" />

          {/* 3. The Perfect Reference Line
              We link this line to the "math" axis. 
          */}
          <ReferenceLine
            xAxisId="math"
            x={medianPosition}
            stroke="#fbbf24"
            strokeDasharray="5 5"
            strokeWidth={2}
          >
            <Label
              value="Median"
              position="top"
              fill="#fbbf24"
              fontSize={12}
              fontWeight="bold"
            />
          </ReferenceLine>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
