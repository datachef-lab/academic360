
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface ChartBarHorizontalProps {
  data: { label: string; value: number }[];
  title?: string;
  description?: string;
}

export function ChartBarHorizontal({ data, title = "Course-wise Student Stats", description }: ChartBarHorizontalProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <div className="text-muted-foreground text-sm">{description}</div>}
      </CardHeader>
      <CardContent>
        <div className="w-full h-[600px]">
          <ResponsiveContainer width="100%" height={600}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="label" type="category" width={180} tick={{ fontSize: 14 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" radius={5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 